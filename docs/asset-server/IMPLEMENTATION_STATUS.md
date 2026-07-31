# Asset-Server-First Implementation Status

```yaml
project: roBrowserLegacy asset-server-first
branch: feature/asset-server-first
pull_request: 1
status: IN_PROGRESS
hourly_loop: CONTINUE
current_round: 3
next_round: 3
updated_at: 2026-08-01T01:16:00+07:00
```

## Round 1 — Repository baseline and execution contract

```yaml
round: 1
status: PASS
objective: Establish the controlled implementation baseline before runtime integration.
```

### Acceptance gate

- [x] Current branch and PR identified.
- [x] Startup entry points identified.
- [x] Legacy GRF/local-source configuration surfaces identified.
- [x] Runtime asset I/O seam identified.
- [x] Risks and execution rules documented.
- [x] No runtime behavior changed.

## Round 2 — Asset Bootstrap Coordinator

```yaml
round: 2
status: PASS
objective: Add and verify a deterministic coordinator for configuration, manifest loading, required-group validation, and fail-closed bootstrap errors.
```

### Evidence

```yaml
successful_workflow_run: 30642091440
successful_job: 91194301183
```

### Acceptance gate

- [x] Bootstrap coordinator added.
- [x] Deterministic states defined.
- [x] Configuration and manifest loading sequenced.
- [x] Required-group validation invoked before `ready`.
- [x] Focused tests added and verified.
- [x] Vitest, ESLint, and Prettier verified by CI.

## Round 3 — Wire Asset Bootstrap into application startup

```yaml
round: 3
status: PARTIAL
objective: Gate the Online application startup on successful asset configuration, manifest loading, and required-group validation.
```

### Implemented

- Added `src/Assets/AssetStartup.js` as the testable startup policy.
- Asset-server mode is now the default startup path.
- Local GRF/data import bypass is allowed only when both `development: true` and `assetBootstrap.allowLocalImport: true` are explicitly configured.
- Added support for deployment-specific `assetBootstrap.configPath`.
- Removed the import-time `Online.init()` side effect.
- Updated `src/main.js` to initialize assets before dynamically importing and starting `App/Online.js`.
- Online startup now fails closed and emits `robrowser-startup-error` without dispatching `robrowser-ready`.
- Added controlled preloader error rendering without exposing stack details.
- Added `tests/Assets/AssetStartup.test.js` covering default asset-server startup, custom config path, explicit local-development bypass, fail-closed rejection, and controlled error rendering.
- Expanded the focused GitHub Actions workflow to cover startup source and tests.
- `FileManager` manifest resolution was intentionally not changed; it remains Round 4.
- Corrected Prettier formatting in `src/Assets/AssetStartup.js` and `src/main.js` after CI identified those two files.

### Evidence

```yaml
commits:
  - c0b9608f6f64a5b8d45ddc47bfad00bb864f4958
  - 84897cd8b9142845b75c7a622b9cf35a3797f5a5
  - 3bf681bfe5d6dfaeb4c51af328631cd974fc19fe
  - f0efbb21023622bb6b6ac2f316d0ab67d6d9f576
  - 404de9ed0ef3dcce17829a2bcb42451d652db7cb
  - 1f08638fce3fa3b9bec595583a86e317364f3cd5
  - 15e6153b739e2f299d877a79ec07779184510ec5
failed_workflow_run: 30650496937
failed_job: 91222268828
verification_from_failed_run:
  vitest: 10 passed
  eslint: passed
  prettier: failed only for AssetStartup.js and main.js
replacement_workflow_run: 30654641197
replacement_workflow_status: queued
pull_request: 1
```

### Acceptance gate

- [x] Startup source inspected before modification.
- [x] Online startup waits for Asset Bootstrap.
- [x] Production/default mode fails closed.
- [x] Local import requires explicit development configuration.
- [x] Controlled startup error path added.
- [x] Focused tests added.
- [x] `FileManager` integration deferred to Round 4.
- [x] Focused Vitest execution verified for Round 3.
- [x] Focused ESLint execution verified for Round 3.
- [ ] Focused Prettier execution verified after formatting corrections.

### Current blocker

The previous focused workflow verified all 10 tests and ESLint, then failed only because Prettier reported `src/Assets/AssetStartup.js` and `src/main.js`. Both files were reformatted and a replacement workflow was triggered. The replacement run was still queued at the end of this controlled cycle, so Round 3 remains `PARTIAL` until CI confirms formatting success.

## Next controlled round

Continue **Round 3** only:

1. Inspect workflow run `30654641197` for commit `15e6153b739e2f299d877a79ec07779184510ec5` or the latest status-document commit.
2. Mark Round 3 `PASS` only after focused Prettier verification succeeds together with tests and lint.
3. Fix only Round 3 verification failures if CI still fails.
4. Do not begin `FileManager` manifest integration until the Round 3 gate passes.
