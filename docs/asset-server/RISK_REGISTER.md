# Asset-Server-First Risk Register

| ID | Risk | Impact | Control |
|---|---|---:|---|
| AS-R01 | Production silently falls back to local GRF or folder access | Critical | Fail closed in production; allow legacy import only with an explicit non-production flag. |
| AS-R02 | Manifest and JavaScript client are incompatible | High | Add schema and compatibility validation before login. |
| AS-R03 | Legacy paths differ by slash, case, Unicode normalization, or CP949 decoding | High | Introduce canonical path and alias registries before broad FileManager migration. |
| AS-R04 | Missing assets are discovered only during gameplay | High | Add preflight groups, completeness scanning, and runtime telemetry. |
| AS-R05 | Asset-server outage produces a blank screen or infinite retry | High | Use a finite timeout, structured bootstrap states, actionable error UI, and bounded retry. |
| AS-R06 | Partial patch mixes files from different releases | Critical | Use immutable content-addressed objects and an atomic current-manifest pointer. |
| AS-R07 | Browser cache serves stale mutable files | High | Cache immutable objects by hash; disable caching for the current pointer. |
| AS-R08 | Manifest path allows traversal or arbitrary origin injection | Critical | Validate origins, normalize paths, reject traversal, and restrict providers. |
| AS-R09 | Local/private assets are committed to Git | Critical | Keep source and published assets outside the repository; commit only code, schemas, fixtures, and reports without proprietary payloads. |
| AS-R10 | Refactoring FileManager breaks existing loaders | High | Wrap existing loaders/providers first; migrate incrementally with regression tests. |
| AS-R11 | Encoding fixes are applied in UI components and cause double decoding | High | Decode raw text only at defined encoding boundaries and normalize runtime strings to Unicode. |
| AS-R12 | Player-facing GRF controls are removed before production bootstrap works | High | Preserve the development importer until bootstrap, manifest, resolver, and error UX pass E2E gates. |
| AS-R13 | Hourly agent skips an acceptance gate | High | Earliest-incomplete-round rule and mandatory status evidence. |
| AS-R14 | Tests cannot run in the execution environment | Medium | Record the limitation as a blocker when code changes require executable verification; do not mark the round PASS without equivalent evidence. |

## Current highest risks

1. Startup is not yet gated by asset configuration and manifest validation.
2. FileManager still uses legacy filesystem/GRF/HTTP fallback behavior.
3. No automated tests currently cover the newly added asset-server modules.
4. No completeness or encoding audit exists yet.
