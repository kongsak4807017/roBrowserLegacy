# Asset-Server-First Execution Contract

## Controlled-cycle rule

Each scheduled cycle works on the earliest incomplete round only. A later round must not start until the current round's acceptance gate is recorded as `PASS`.

## Branch and pull request

- Repository: `kongsak4807017/roBrowserLegacy`
- Branch: `feature/asset-server-first`
- Pull request: `#1`
- Base branch: `master`

## Required cycle sequence

1. Read `IMPLEMENTATION_STATUS.md` and the architecture plan.
2. Inspect the relevant source before modification.
3. Implement only the selected round.
4. Add or update focused tests.
5. Run applicable lint, formatting, unit, integration, build, and validation commands.
6. Do not add licensed/private Ragnarok assets.
7. Commit to the feature branch.
8. Update the draft pull request with evidence.
9. Record `PASS`, `PARTIAL`, `BLOCKED`, or `COMPLETE`.

## Stop conditions

A cycle stops without advancing when:

- a required source file or dependency is unavailable;
- tests fail and cannot be corrected within the round;
- a compatibility or security decision is unresolved;
- private assets would be required to continue;
- the current acceptance gate is not satisfied.

When blocked, update the status document with the exact blocker and continue the same round during the next cycle.

## Completion condition

Only after every project acceptance criterion is verified may the status be changed to:

```yaml
status: COMPLETE
hourly_loop: STOP
```

After this marker, scheduled cycles must not modify code.

## Safety boundaries

- Production must fail closed when asset-server configuration or critical manifest groups are unavailable.
- Production must not silently fall back to local GRF or local folder access.
- Local import remains an explicit development-only capability until it is intentionally retired.
- Manifest paths and asset URLs must be validated before runtime use.
- Asset-server changes must remain separate from rAthena gameplay/database changes.
