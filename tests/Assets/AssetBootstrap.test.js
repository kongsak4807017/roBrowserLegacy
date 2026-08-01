import { describe, expect, it, vi } from 'vitest';

import AssetBootstrap, { AssetBootstrapState } from '../../src/Assets/AssetBootstrap.js';

function validConfig() {
	return {
		mode: 'production',
		assetServer: 'https://assets.example.com/roweb/',
		manifest: 'manifests/current.json',
		requiredGroups: ['bootstrap']
	};
}

function validManifest() {
	return {
		releaseId: 'test-release',
		groups: { bootstrap: ['ui.login.background'] },
		assets: { 'ui.login.background': { path: 'aa/bb/background.bmp' } },
		validateRequiredGroups: vi.fn(),
		get(assetId) {
			const asset = this.assets[assetId];
			if (!asset) throw new Error('Invalid asset record: ' + assetId);
			return asset;
		}
	};
}

describe('AssetBootstrap', () => {
	it('loads configuration and manifest in order, runs preflight, and reaches ready', async () => {
		const calls = [];
		const config = validConfig();
		const manifest = validManifest();
		const preflightReport = { status: 'pass' };
		const runPreflight = vi.fn(() => preflightReport);
		const states = [];
		const bootstrap = new AssetBootstrap({
			loadConfig: async path => {
				calls.push(['config', path]);
				return config;
			},
			loadManifest: async loadedConfig => {
				calls.push(['manifest', loadedConfig]);
				return manifest;
			},
			runPreflight,
			onStateChange: state => states.push(state)
		});

		const result = await bootstrap.initialize('/custom-assets.json');

		expect(calls).toEqual([
			['config', '/custom-assets.json'],
			['manifest', config]
		]);
		expect(manifest.validateRequiredGroups).toHaveBeenCalledWith(['bootstrap']);
		expect(runPreflight).toHaveBeenCalledWith(manifest, ['bootstrap']);
		expect(result).toEqual({ config, manifest, preflightReport });
		expect(bootstrap.state).toBe(AssetBootstrapState.READY);
		expect(states).toEqual([
			AssetBootstrapState.LOADING_CONFIG,
			AssetBootstrapState.LOADING_MANIFEST,
			AssetBootstrapState.VALIDATING,
			AssetBootstrapState.READY
		]);
	});

	it('classifies an aborted request as a timeout and fails closed', async () => {
		const timeout = new Error('aborted');
		timeout.name = 'AbortError';
		const bootstrap = new AssetBootstrap({
			loadConfig: async () => {
				throw timeout;
			}
		});

		await expect(bootstrap.initialize()).rejects.toMatchObject({
			name: 'AssetBootstrapError',
			code: 'ASSET_BOOTSTRAP_TIMEOUT'
		});
		expect(bootstrap.state).toBe(AssetBootstrapState.FAILED);
		expect(bootstrap.manifest).toBeNull();
	});

	it('classifies invalid configuration and does not load a manifest', async () => {
		const loadManifest = vi.fn();
		const bootstrap = new AssetBootstrap({
			loadConfig: async () => {
				throw new Error('Asset server configuration must be an object.');
			},
			loadManifest
		});

		await expect(bootstrap.initialize()).rejects.toMatchObject({ code: 'ASSET_CONFIG_INVALID' });
		expect(loadManifest).not.toHaveBeenCalled();
		expect(bootstrap.state).toBe(AssetBootstrapState.FAILED);
	});

	it('fails when a required manifest group is incomplete', async () => {
		const manifest = validManifest();
		manifest.validateRequiredGroups.mockImplementation(() => {
			throw new Error('Required asset group is missing: bootstrap');
		});
		const bootstrap = new AssetBootstrap({
			loadConfig: async () => validConfig(),
			loadManifest: async () => manifest
		});

		await expect(bootstrap.initialize()).rejects.toMatchObject({
			code: 'ASSET_REQUIRED_GROUP_INVALID'
		});
		expect(bootstrap.state).toBe(AssetBootstrapState.FAILED);
	});

	it('preserves the preflight report when critical completeness validation fails', async () => {
		const report = { status: 'fail', criticalFailures: ['bootstrap'] };
		const preflightError = Object.assign(new Error('Asset preflight failed.'), {
			code: 'ASSET_PREFLIGHT_CRITICAL_FAILURE',
			report
		});
		const bootstrap = new AssetBootstrap({
			loadConfig: async () => validConfig(),
			loadManifest: async () => validManifest(),
			runPreflight: () => {
				throw preflightError;
			}
		});

		await expect(bootstrap.initialize()).rejects.toMatchObject({
			code: 'ASSET_PREFLIGHT_CRITICAL_FAILURE',
			report
		});
		expect(bootstrap.preflightReport).toBeNull();
		expect(bootstrap.state).toBe(AssetBootstrapState.FAILED);
	});

	it('rejects concurrent or repeated initialization from an active state', async () => {
		let releaseConfig;
		const bootstrap = new AssetBootstrap({
			loadConfig: () =>
				new Promise(resolve => {
					releaseConfig = resolve;
				}),
			loadManifest: async () => validManifest()
		});

		const first = bootstrap.initialize();
		await expect(bootstrap.initialize()).rejects.toMatchObject({
			code: 'ASSET_BOOTSTRAP_STATE_INVALID'
		});

		releaseConfig(validConfig());
		await first;
	});
});
