import { describe, expect, it, vi } from 'vitest';
import {
	createAssetFileResolver,
	installAssetFileResolver,
	normalizeAssetPath
} from '../../src/Assets/AssetFileResolver.js';

function createManifest() {
	return {
		assets: {
			'ui.login.background': {
				path: 'ab/cd/background.bin',
				legacyAliases: ['data\\texture\\유저인터페이스\\background.bmp']
			}
		},
		resolve: vi.fn(assetId => 'https://assets.example/objects/' + assetId)
	};
}

describe('AssetFileResolver', () => {
	it('normalizes slashes, percent encoding, Unicode, and case', () => {
		expect(normalizeAssetPath(' DATA\\Texture\\%C3%89.bmp ')).toBe('data/texture/é.bmp');
	});

	it('resolves a legacy alias through the manifest', () => {
		const manifest = createManifest();
		const resolver = createAssetFileResolver(manifest);

		expect(resolver.resolve('data/texture/유저인터페이스/background.bmp')).toBe(
			'https://assets.example/objects/ui.login.background'
		);
		expect(manifest.resolve).toHaveBeenCalledWith('ui.login.background');
	});

	it('returns null for an unmapped asset', () => {
		const resolver = createAssetFileResolver(createManifest());
		expect(resolver.resolve('data/missing.bmp')).toBeNull();
	});

	it('replaces FileManager get with manifest-only fetching', async () => {
		const buffer = new ArrayBuffer(4);
		const fetchImpl = vi.fn(async () => ({
			ok: true,
			arrayBuffer: async () => buffer
		}));
		const FileManager = {};
		installAssetFileResolver(FileManager, createManifest(), { fetchImpl });

		const result = await new Promise(resolve => {
			FileManager.get('data/texture/유저인터페이스/background.bmp', (value, error) => {
				resolve({ value, error });
			});
		});

		expect(result).toEqual({ value: buffer, error: undefined });
		expect(fetchImpl).toHaveBeenCalledWith('https://assets.example/objects/ui.login.background');
	});

	it('fails closed without invoking local fallback for an unmapped asset', async () => {
		const fetchImpl = vi.fn();
		const FileManager = {};
		installAssetFileResolver(FileManager, createManifest(), { fetchImpl });

		const result = await new Promise(resolve => {
			FileManager.get('data/missing.bmp', (value, error) => resolve({ value, error }));
		});

		expect(result.value).toBeNull();
		expect(result.error).toContain('not mapped');
		expect(fetchImpl).not.toHaveBeenCalled();
	});
});
