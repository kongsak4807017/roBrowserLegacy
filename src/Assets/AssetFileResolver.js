function decodePathSegment(segment) {
	try {
		return decodeURIComponent(segment);
	} catch {
		return segment;
	}
}

function normalizeAssetPath(path) {
	return String(path || '')
		.trim()
		.replace(/\\/g, '/')
		.split('/')
		.filter(Boolean)
		.map(decodePathSegment)
		.join('/')
		.normalize('NFC')
		.toLowerCase();
}

function buildManifestIndex(manifest) {
	const index = new Map();

	Object.entries(manifest.assets || {}).forEach(([assetId, asset]) => {
		const candidates = [assetId, asset.path, ...(asset.legacyAliases || [])];
		candidates.forEach(candidate => {
			const normalized = normalizeAssetPath(candidate);
			if (normalized && !index.has(normalized)) {
				index.set(normalized, assetId);
			}
		});
	});

	return index;
}

function createAssetFileResolver(manifest) {
	if (!manifest || typeof manifest.resolve !== 'function') {
		throw new Error('A ready asset manifest is required for FileManager integration.');
	}

	const index = buildManifestIndex(manifest);

	return {
		normalize: normalizeAssetPath,
		resolve(filename) {
			const assetId = index.get(normalizeAssetPath(filename));
			return assetId ? manifest.resolve(assetId) : null;
		}
	};
}

function installAssetFileResolver(FileManager, manifest, options = {}) {
	const resolver = createAssetFileResolver(manifest);
	const fetchImpl = options.fetchImpl || globalThis.fetch;

	if (typeof fetchImpl !== 'function') {
		throw new Error('Fetch API is required for asset-server file resolution.');
	}

	FileManager.assetResolver = resolver;
	FileManager.get = function getFromAssetServer(filename, callback) {
		const url = resolver.resolve(filename);
		if (!url) {
			callback(null, 'Asset is not mapped in the active manifest: ' + filename);
			return;
		}

		if (String(filename).match(/\.(mp3|wav)$/i)) {
			callback(url);
			return;
		}

		fetchImpl(url)
			.then(response => {
				if (!response.ok) {
					throw new Error('HTTP ' + response.status);
				}
				return response.arrayBuffer();
			})
			.then(buffer => callback(buffer))
			.catch(error => callback(null, error.message));
	};

	return resolver;
}

export { buildManifestIndex, createAssetFileResolver, installAssetFileResolver, normalizeAssetPath };
