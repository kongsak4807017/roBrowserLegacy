import AssetServerConfig from './AssetServerConfig.js';

function validateAsset(assetId, asset) {
	if (!asset || typeof asset !== 'object') {
		throw new Error('Invalid asset record: ' + assetId);
	}
	if (!asset.path || typeof asset.path !== 'string') {
		throw new Error('Asset path is required: ' + assetId);
	}
	return asset;
}

export default class AssetManifest {
	static current = null;

	constructor(document) {
		if (!document || document.schemaVersion !== 1) {
			throw new Error('Unsupported asset manifest schema.');
		}
		if (!document.releaseId || !document.assets || typeof document.assets !== 'object') {
			throw new Error('Asset manifest is missing release metadata or assets.');
		}

		this.releaseId = document.releaseId;
		this.generatedAt = document.generatedAt || null;
		this.baseUrl = document.baseUrl || AssetServerConfig.require().assetServer;
		this.compatibility = document.compatibility || {};
		this.groups = document.groups || {};
		this.assets = document.assets;
	}

	static async load() {
		const config = AssetServerConfig.require();
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);

		try {
			const response = await fetch(AssetServerConfig.manifestUrl(), {
				cache: 'no-cache',
				signal: controller.signal
			});
			if (!response.ok) {
				throw new Error('Unable to load asset manifest: HTTP ' + response.status);
			}
			const manifest = new AssetManifest(await response.json());
			manifest.validateRequiredGroups(config.requiredGroups);
			AssetManifest.current = manifest;
			return manifest;
		} finally {
			clearTimeout(timeout);
		}
	}

	validateRequiredGroups(groupIds) {
		for (const groupId of groupIds) {
			const assetIds = this.groups[groupId];
			if (!Array.isArray(assetIds)) {
				throw new Error('Required asset group is missing: ' + groupId);
			}
			for (const assetId of assetIds) {
				this.get(assetId);
			}
		}
	}

	get(assetId) {
		return validateAsset(assetId, this.assets[assetId]);
	}

	resolve(assetId) {
		const asset = this.get(assetId);
		return new URL(asset.path.replace(/^\/+/, ''), this.baseUrl).toString();
	}
}
