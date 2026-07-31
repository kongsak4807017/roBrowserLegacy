import AssetManifest from './AssetManifest.js';
import AssetServerConfig from './AssetServerConfig.js';

const AssetBootstrapState = Object.freeze({
	IDLE: 'idle',
	LOADING_CONFIG: 'loading-config',
	LOADING_MANIFEST: 'loading-manifest',
	VALIDATING: 'validating',
	READY: 'ready',
	FAILED: 'failed'
});

class AssetBootstrapError extends Error {
	constructor(code, message, cause = null) {
		super(message);
		this.name = 'AssetBootstrapError';
		this.code = code;
		this.cause = cause;
	}
}

function classifyError(error) {
	if (error instanceof AssetBootstrapError) {
		return error;
	}

	if (error?.name === 'AbortError') {
		return new AssetBootstrapError('ASSET_BOOTSTRAP_TIMEOUT', 'Asset bootstrap request timed out.', error);
	}

	const message = error?.message || 'Unknown asset bootstrap failure.';
	let code = 'ASSET_BOOTSTRAP_FAILED';

	if (message.includes('configuration')) {
		code = 'ASSET_CONFIG_INVALID';
	} else if (message.includes('Required asset group') || message.includes('Invalid asset record')) {
		code = 'ASSET_REQUIRED_GROUP_INVALID';
	} else if (message.includes('manifest')) {
		code = 'ASSET_MANIFEST_INVALID';
	}

	return new AssetBootstrapError(code, message, error);
}

export default class AssetBootstrap {
	constructor(options = {}) {
		this._loadConfig = options.loadConfig || (path => AssetServerConfig.load(path));
		this._loadManifest = options.loadManifest || (() => AssetManifest.load());
		this._onStateChange = options.onStateChange || null;
		this.state = AssetBootstrapState.IDLE;
		this.config = null;
		this.manifest = null;
		this.error = null;
	}

	_setState(state) {
		this.state = state;
		if (this._onStateChange) {
			this._onStateChange(state, this);
		}
	}

	async initialize(configPath) {
		if (this.state !== AssetBootstrapState.IDLE && this.state !== AssetBootstrapState.FAILED) {
			throw new AssetBootstrapError(
				'ASSET_BOOTSTRAP_STATE_INVALID',
				'Asset bootstrap cannot initialize from state: ' + this.state
			);
		}

		this.config = null;
		this.manifest = null;
		this.error = null;

		try {
			this._setState(AssetBootstrapState.LOADING_CONFIG);
			this.config = await this._loadConfig(configPath);

			this._setState(AssetBootstrapState.LOADING_MANIFEST);
			this.manifest = await this._loadManifest(this.config);

			this._setState(AssetBootstrapState.VALIDATING);
			if (!this.manifest || typeof this.manifest.validateRequiredGroups !== 'function') {
				throw new AssetBootstrapError(
					'ASSET_MANIFEST_INVALID',
					'Asset manifest does not support required-group validation.'
				);
			}
			this.manifest.validateRequiredGroups(this.config.requiredGroups || []);

			this._setState(AssetBootstrapState.READY);
			return Object.freeze({ config: this.config, manifest: this.manifest });
		} catch (error) {
			this.error = classifyError(error);
			this._setState(AssetBootstrapState.FAILED);
			throw this.error;
		}
	}
}

export { AssetBootstrapError, AssetBootstrapState, classifyError };
