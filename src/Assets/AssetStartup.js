import AssetBootstrap from './AssetBootstrap.js';

const LOCAL_DEVELOPMENT_MODE = 'local-development';
const ASSET_SERVER_MODE = 'asset-server';

function isExplicitLocalDevelopment(config = {}) {
	return (
		config.development === true &&
		config.assetBootstrap &&
		config.assetBootstrap.allowLocalImport === true
	);
}

function getConfigPath(config = {}) {
	return config.assetBootstrap?.configPath || undefined;
}

async function initializeAssetStartup(config = {}, options = {}) {
	if (isExplicitLocalDevelopment(config)) {
		return Object.freeze({
			mode: LOCAL_DEVELOPMENT_MODE,
			config: null,
			manifest: null
		});
	}

	const createBootstrap =
		options.createBootstrap || (() => new AssetBootstrap(options.bootstrapOptions));
	const bootstrap = createBootstrap();
	const result = await bootstrap.initialize(getConfigPath(config));

	return Object.freeze({
		mode: ASSET_SERVER_MODE,
		config: result.config,
		manifest: result.manifest,
		bootstrap
	});
}

function renderAssetStartupError(error, documentRef = document) {
	const preloader = documentRef.getElementById('ro-preloader');
	if (!preloader) {
		return;
	}

	preloader.dataset.status = 'asset-startup-failed';
	preloader.dataset.errorCode = error?.code || 'ASSET_BOOTSTRAP_FAILED';

	const text = preloader.querySelector('.pre-text');
	if (text) {
		text.textContent = 'Unable to load game assets. Please retry later.';
	}
}

export {
	ASSET_SERVER_MODE,
	LOCAL_DEVELOPMENT_MODE,
	getConfigPath,
	initializeAssetStartup,
	isExplicitLocalDevelopment,
	renderAssetStartupError
};
