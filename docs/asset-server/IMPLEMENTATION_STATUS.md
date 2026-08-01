# Asset-Server-First Implementation Status

```yaml
project: roBrowserLegacy asset-server-first
branch: feature/asset-server-first
pull_request: 1
status: IN_PROGRESS
hourly_loop: CONTINUE
current_round: 4
next_round: 4
updated_at: 2026-08-01T16:13:00+07:00
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
status: PASS
objective: Gate Online startup on successful asset configuration, manifest loading, and required-group validation.
verified_branch_head: ababf9eb912eacc41413bc5dd37c36a67b2ff41b
```

### Acceptance evidence

```yaml
focused_workflow_run: 30687385895
focused_workflow_conclusion: success
lint_workflow_run: 30687385906
lint_workflow_conclusion: success
format_workflow_run: 30687385899
format_workflow_conclusion: success
build_workflow_run: 30687385896
build_workflow_conclusion: success
codeql_workflow_run: 30687385912
codeql_workflow_conclusion: success
proprietary_assets_added: false
private_assets_added: false
```

## Round 4 — FileManager manifest integration

```yaml
round: 4
status: PARTIAL
objective: Route production runtime asset reads through the active manifest while preserving local GRF/FileSystem behavior only in explicit local-development mode.
implementation_head: 70b00297b868aa7fd5879880d45ed169dd12cdf1
workflow_fix_head: 314e5102f5d08b31e38580df758388f8819b5379
```

### Implemented

- Inspected the existing `FileManager.get` and `FileManager.getHTTP` resolution order before modifying startup integration.
- Added `src/Assets/AssetFileResolver.js` with canonical slash, percent-decoding, Unicode NFC, and case normalization.
- Built a lookup index from asset IDs, immutable object paths, and `legacyAliases`.
- Installed a manifest-backed `FileManager.get` implementation before `Online.init()` in asset-server mode.
- Production asset-server mode now fails closed for unmapped files instead of falling through to FileSystem, GRF, or `/client/` origins.
- Explicit local-development startup remains unchanged and therefore retains the legacy local FileManager path.
- Added focused tests for normalization, alias resolution, HTTP fetching, and unmapped-asset fail-closed behavior.

### Acceptance evidence from branch head `2751ce3e12be219fb3b2b9646fb493f2f6bff692`

```yaml
focused_workflow_run: 30691381785
focused_workflow_job: 91346611795
focused_vitest: PASS
focused_vitest_tests: 15
focused_eslint: FAIL
focused_eslint_reason: test file is intentionally ignored by repository ESLint configuration, producing one ignored-file warning under --max-warnings 0
focused_prettier: SKIPPED
lint_workflow_run: 30691381796
lint_workflow_conclusion: success
format_workflow_run: 30691381775
format_workflow_conclusion: success
build_workflow_run: 30691381789
build_workflow_conclusion: success
codeql_workflow_run: 30691381765
codeql_workflow_conclusion: success
```

### Controlled-cycle fix

- Inspected the failing workflow log before modifying the workflow.
- Removed the ESLint-ignored test file from the focused lint command while retaining that test in Vitest and Prettier verification.
- Committed the workflow-only correction as `314e5102f5d08b31e38580df758388f8819b5379`.
- No runtime source, acceptance criteria, or asset files were changed in this cycle.

### Acceptance gate

- [x] Relevant FileManager and manifest/startup source inspected before modification.
- [x] Production requests resolve through the active manifest.
- [x] Slashes, percent encoding, Unicode normalization, and aliases are handled.
- [x] Unmapped production assets fail closed without local fallback.
- [x] Explicit local-development mode preserves the legacy FileManager path.
- [x] Focused tests added.
- [x] Focused Vitest passed on the previous branch head.
- [ ] Focused ESLint and Prettier verified after workflow correction.
- [ ] Repository workflows verified on the new workflow-fix head.

### Current blocker

Replacement workflow runs for commit `314e5102f5d08b31e38580df758388f8819b5379` were not yet visible when this controlled cycle closed. Round 4 cannot be marked `PASS` until the focused workflow and applicable repository workflows complete successfully on that head.

### Result

Round 4 remains `PARTIAL`. Continue Round 4 next cycle by checking workflow results for `314e5102f5d08b31e38580df758388f8819b5379`. Fix only Round 4 failures if present; otherwise mark Round 4 `PASS` and advance to Round 5 without implementing Round 5 in the same cycle.

## Asset safety

```yaml
proprietary_assets_added: false
private_assets_added: false
```
