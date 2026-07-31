import { describe, expect, it, vi } from 'vitest';

import {
	ASSET_SERVER_MODE,
	LOCAL_DEVELOPMENT_MODE,
	initializeAssetStartup,
	isExplicitLocalDevelopment,
	renderAssetStartupError
} from '../../src/Assets/AssetStartup.js';

describe('AssetStartup', () => {
	it('uses the asset server by default and waits for bootstrap initialization', async () => {
		const initialize = vi.fn().mockResolvedValue({ config: { mode: 'production' }, manifest: { releaseId: 'r1' } });
		const createBootstrap = vi.fn(() => ({ initialize }));

		const result = await initializeAssetStartup({}, { createBootstrap });

		expect(createBootstrap).toHaveBeenCalledOnce();
		expect(initialize).toHaveBeenCalledWith(undefined);
		expect(result.mode).toBe(ASSET_SERVER_MODE);
		expect(result.manifest.releaseId).toBe('r1');
	});

	it('passes an explicitly configured bootstrap path', async () => {
		const initialize = vi.fn().mockResolvedValue({ config: {}, manifest: {} });

		await initializeAssetStartup(
			{ assetBootstrap: { configPath: '/deploy/assets.json' } },
			{ createBootstrap: () => ({ initialize }) }
		);

		expect(initialize).toHaveBeenCalledWith('/deploy/assets.json');
	});

	it('allows local import only when development and the explicit flag are both enabled', async () => {
		expect(isExplicitLocalDevelopment({ development: true })).toBeFalsy();
		expect(isExplicitLocalDevelopment({ assetBootstrap: { allowLocalImport: true } })).toBeFalsy();

		const createBootstrap = vi.fn();
		const result = await initializeAssetStartup(
			{ development: true, assetBootstrap: { allowLocalImport: true } },
			{ createBootstrap }
		);

		expect(result.mode).toBe(LOCAL_DEVELOPMENT_MODE);
		expect(createBootstrap).not.toHaveBeenCalled();
	});

	it('fails closed when bootstrap rejects', async () => {
		const failure = Object.assign(new Error('manifest unavailable'), { code: 'ASSET_MANIFEST_INVALID' });

		await expect(
			initializeAssetStartup({}, { createBootstrap: () => ({ initialize: vi.fn().mockRejectedValue(failure) }) })
		).rejects.toBe(failure);
	});

	it('renders a controlled startup error without exposing the stack', () => {
		const text = { textContent: '' };
		const preloader = {
			dataset: {},
			querySelector: vi.fn(() => text)
		};
		const documentRef = { getElementById: vi.fn(() => preloader) };

		renderAssetStartupError({ code: 'ASSET_CONFIG_INVALID' }, documentRef);

		expect(preloader.dataset).toEqual({
			status: 'asset-startup-failed',
			errorCode: 'ASSET_CONFIG_INVALID'
		});
		expect(text.textContent).toBe('Unable to load game assets. Please retry later.');
	});
});
