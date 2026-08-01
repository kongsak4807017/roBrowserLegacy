import { describe, expect, it } from 'vitest';

import AssetPreflight from '../../src/Assets/AssetPreflight.js';

function manifest(overrides = {}) {
	const assets = {
		'ui.login.background': { path: 'aa/bb/background.bmp' },
		'ui.cursor.default': { path: 'cc/dd/cursor.bmp' }
	};

	return {
		releaseId: 'test-release',
		groups: {
			bootstrap: ['ui.login.background', 'ui.cursor.default']
		},
		assets,
		get(assetId) {
			const asset = this.assets[assetId];
			if (!asset) throw new Error('Invalid asset record: ' + assetId);
			if (!asset.path) throw new Error('Asset path is required: ' + assetId);
			return asset;
		},
		...overrides
	};
}

describe('AssetPreflight', () => {
	it('produces a machine-readable pass report for complete critical groups', () => {
		const report = AssetPreflight.run(manifest(), ['bootstrap']);

		expect(report).toEqual({
			schemaVersion: 1,
			releaseId: 'test-release',
			status: 'pass',
			summary: {
				checkedGroups: 1,
				checkedAssets: 2,
				failedGroups: 0
			},
			groups: [
				{
					groupId: 'bootstrap',
					critical: true,
					status: 'pass',
					assetCount: 2,
					missingAssets: [],
					invalidAssets: []
				}
			],
			criticalFailures: []
		});
	});

	it('blocks startup and attaches a report when a critical group is absent', () => {
		expect(() => AssetPreflight.run(manifest(), ['login'])).toThrowError(
			expect.objectContaining({
				code: 'ASSET_PREFLIGHT_CRITICAL_FAILURE',
				report: expect.objectContaining({
					status: 'fail',
					criticalFailures: ['login']
				})
			})
		);
	});

	it('distinguishes missing and invalid assets in completeness reports', () => {
		const incomplete = manifest({
			groups: { bootstrap: ['missing.asset', 'invalid.asset'] },
			assets: { 'invalid.asset': {} }
		});
		const report = AssetPreflight.createReport(incomplete, ['bootstrap']);

		expect(report.status).toBe('fail');
		expect(report.groups[0].missingAssets).toEqual(['missing.asset']);
		expect(report.groups[0].invalidAssets).toEqual([
			{ assetId: 'invalid.asset', message: 'Asset path is required: invalid.asset' }
		]);
	});

	it('renders an actionable human-readable failure report', () => {
		const report = AssetPreflight.createReport(manifest(), ['login']);
		const text = AssetPreflight.toHumanReadable(report);

		expect(text).toContain('Asset preflight FAIL for release test-release');
		expect(text).toContain('login: group missing');
	});
});
