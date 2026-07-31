const DEFAULT_CONFIG_PATH = '/config/asset-server.json';

function ensureTrailingSlash(value) {
	return value.endsWith('/') ? value : value + '/';
}

function validateConfig(config) {
	if (!config || typeof config !== 'object') {
		throw new Error('Asset server configuration must be an object.');
	}

	if (config.schemaVersion !== 1) {
		throw new Error('Unsupported asset server configuration schema.');
	}

	if (!config.assetServer || typeof config.assetServer !== 'string') {
		throw new Error('assetServer is required.');
	}

	if (!config.manifest || typeof config.manifest !== 'string') {
		throw new Error('manifest is required.');
	}

	const mode = config.mode || 'production';
	const allowLocalImport = mode !== 'production' && config.allowLocalImport === true;

	return Object.freeze({
		schemaVersion: 1,
		mode,
		assetServer: ensureTrailingSlash(config.assetServer),
		manifest: config.manifest.replace(/^\/+/, ''),
		allowLocalImport,
		requestTimeoutMs: Number.isFinite(config.requestTimeoutMs) ? config.requestTimeoutMs : 15000,
		telemetryEndpoint: config.telemetryEndpoint || null,
		requiredGroups: Array.isArray(config.requiredGroups) ? config.requiredGroups.slice() : []
	});
}

export default class AssetServerConfig {
	static current = null;

	static async load(path = DEFAULT_CONFIG_PATH) {
		const response = await fetch(path, {
			cache: 'no-store',
			credentials: 'same-origin'
		});

		if (!response.ok) {
			throw new Error('Unable to load asset server configuration: HTTP ' + response.status);
		}

		const config = validateConfig(await response.json());
		AssetServerConfig.current = config;
		return config;
	}

	static require() {
		if (!AssetServerConfig.current) {
			throw new Error('Asset server configuration has not been loaded.');
		}
		return AssetServerConfig.current;
	}

	static manifestUrl() {
		const config = AssetServerConfig.require();
		return new URL(config.manifest, config.assetServer).toString();
	}
}

export { DEFAULT_CONFIG_PATH, validateConfig };
