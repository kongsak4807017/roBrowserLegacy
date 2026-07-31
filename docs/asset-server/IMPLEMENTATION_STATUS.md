# Asset-Server-First Implementation Status

```yaml
project: roBrowserLegacy asset-server-first
branch: feature/asset-server-first
pull_request: 1
status: IN_PROGRESS
hourly_loop: CONTINUE
current_round: 3
next_round: 3
updated_at: 2026-08-01T06:13:00+07:00
```

## Round 1 — Repository baseline and execution contract

```yaml
round: 1
status: PASS
```

## Round 2 — Asset Bootstrap Coordinator

```yaml
round: 2
status: PASS
successful_workflow_run: 30642091440
successful_job: 91194301183
```

## Round 3 — Wire Asset Bootstrap into application startup

```yaml
round: 3
status: PARTIAL
objective: Gate Online startup on successful asset configuration, manifest loading, and required-group validation.
```

### Implemented

- Added `src/Assets/AssetStartup.js` as the startup policy.
- Asset-server mode is the default Online startup path.
- Local import requires both `development: true` and `assetBootstrap.allowLocalImport: true`.
- Online startup fails closed and emits `robrowser-startup-error`.
- Added five startup-policy tests.
- Deferred `FileManager` manifest resolution to Round 4.
- Restored the two Round 3 startup files to repository EditorConfig CRLF line endings without changing runtime behavior.
- Updated the focused workflow to check out the pull-request branch head instead of GitHub's synthetic merge commit.

### Evidence

```yaml
failed_workflow_run: 30669349554
failed_job: 91283500422
checked_out_ref: dd98e3caba848e1d813d5d26987d57d7173e09e6
checked_out_ref_type: synthetic pull-request merge commit
vitest: 10 passed
eslint: passed
prettier: failed on src/Assets/AssetStartup.js and src/main.js
parallel_branch_head_checks:
  codeql: passed
  lint: passed
  build: passed
  format: passed
root_cause: focused pull-request workflow formatted the synthetic merge checkout while the successful repository format workflow checked the branch head
workflow_fix_commit: 21d71226ee78c35cf1df4acc94703c3ec8c68a87
workflow_fix: actions/checkout now uses github.event.pull_request.head.sha for pull requests and github.sha for pushes
replacement_workflow_status: not yet visible at cycle close
```

### Acceptance gate

- [x] Startup waits for Asset Bootstrap.
- [x] Production/default mode fails closed.
- [x] Local import requires explicit development configuration.
- [x] Controlled startup error path exists.
- [x] Focused tests exist and pass in CI.
- [x] Focused ESLint passes in CI.
- [ ] Focused Prettier passes on the actual feature branch head.

### Current blocker

Workflow `30669349554` confirmed that all ten focused tests and ESLint pass, but Prettier failed after `actions/checkout` selected GitHub's synthetic pull-request merge commit `dd98e3caba848e1d813d5d26987d57d7173e09e6`. In parallel for the same branch state, the repository-level Format, Lint, Build, and CodeQL workflows all passed. The focused workflow now explicitly checks out the pull-request head SHA, preserving the actual branch contents and repository line-ending policy. No replacement run was visible for commit `21d71226ee78c35cf1df4acc94703c3ec8c68a87` at cycle close, so Round 3 remains `PARTIAL` and Round 4 has not started.

## Next controlled round

Continue Round 3 only. Inspect the focused workflow for commit `21d71226ee78c35cf1df4acc94703c3ec8c68a87` or the subsequent status-document head. Mark Round 3 `PASS` only after Vitest, ESLint, and Prettier all succeed on the feature branch head. Do not begin Round 4 before that gate passes.
