class AssetPreflightError extends Error {
	constructor(message, report) {
		super(message);
		this.name = 'AssetPreflightError';
		this.code = 'ASSET_PREFLIGHT_CRITICAL_FAILURE';
		this.report = report;
	}
}

function inspectGroup(manifest, groupId) {
	const assetIds = manifest.groups?.[groupId];
	const result = {
		groupId,
		critical: true,
		status: 'pass',
		assetCount: 0,
		missingAssets: [],
		invalidAssets: []
	};

	if (!Array.isArray(assetIds)) {
		result.status = 'fail';
		result.missingGroup = true;
		return result;
	}

	result.assetCount = assetIds.length;
	for (const assetId of assetIds) {
		try {
			manifest.get(assetId);
		} catch (error) {
			if (!manifest.assets?.[assetId]) {
				result.missingAssets.push(assetId);
			} else {
				result.invalidAssets.push({ assetId, message: error.message });
			}
		}
	}

	if (result.missingAssets.length > 0 || result.invalidAssets.length > 0) {
		result.status = 'fail';
	}

	return result;
}

function createReport(manifest, requiredGroups) {
	const groups = requiredGroups.map(groupId => inspectGroup(manifest, groupId));
	const failedGroups = groups.filter(group => group.status === 'fail');
	const checkedAssets = groups.reduce((total, group) => total + group.assetCount, 0);

	return Object.freeze({
		schemaVersion: 1,
		releaseId: manifest.releaseId || null,
		status: failedGroups.length === 0 ? 'pass' : 'fail',
		summary: Object.freeze({
			checkedGroups: groups.length,
			checkedAssets,
			failedGroups: failedGroups.length
		}),
		groups: Object.freeze(groups),
		criticalFailures: Object.freeze(failedGroups.map(group => group.groupId))
	});
}

function toHumanReadable(report) {
	const heading = `Asset preflight ${report.status.toUpperCase()} for release ${report.releaseId || 'unknown'}`;
	const summary = `${report.summary.checkedGroups} groups, ${report.summary.checkedAssets} assets, ${report.summary.failedGroups} failures`;
	const failures = report.groups
		.filter(group => group.status === 'fail')
		.map(group => {
			const reasons = [];
			if (group.missingGroup) reasons.push('group missing');
			if (group.missingAssets.length) reasons.push(`missing assets: ${group.missingAssets.join(', ')}`);
			if (group.invalidAssets.length)
				reasons.push(`invalid assets: ${group.invalidAssets.map(item => item.assetId).join(', ')}`);
			return `${group.groupId}: ${reasons.join('; ')}`;
		});

	return [heading, summary, ...failures].join('\n');
}

export default class AssetPreflight {
	static run(manifest, requiredGroups = []) {
		const report = createReport(manifest, requiredGroups);
		if (report.status !== 'pass') {
			throw new AssetPreflightError(toHumanReadable(report), report);
		}
		return report;
	}

	static createReport(manifest, requiredGroups = []) {
		return createReport(manifest, requiredGroups);
	}

	static toHumanReadable(report) {
		return toHumanReadable(report);
	}
}

export { AssetPreflightError, createReport, inspectGroup, toHumanReadable };
