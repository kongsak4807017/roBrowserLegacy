# Asset-Server-First Migration Plan

## Decision

Production players must never browse for a GRF file or a local `data` folder. The client receives one developer-controlled asset-server configuration, downloads a versioned manifest, validates it, and resolves every runtime asset through that manifest.

## Target flow

```text
Developer publishes assets
  -> asset server creates immutable objects + manifest
  -> deployment sets assetServer URL
  -> browser downloads bootstrap manifest
  -> preflight validates required groups
  -> login/character/map assets stream automatically
```

## Runtime rules

1. Local GRF and local-folder selection are disabled in production builds.
2. Local import remains available only behind an explicit development flag.
3. Components request logical asset IDs or canonical paths; they do not choose arbitrary origins.
4. Missing, corrupt, unmapped, unsupported, and encoding-invalid assets are reported separately.
5. Every release has a `releaseId`, manifest hash, compatibility profile, and rollback target.
6. Asset failures produce structured telemetry with map, entity, component, requested path, canonical path, and release ID.

## Required phases

### AS0 — Bootstrap configuration
- Load `/config/asset-server.json` or an injected equivalent.
- Validate URL, manifest path, environment, and security policy.
- Fail closed in production when configuration is absent.

### AS1 — Manifest client
- Download the manifest before opening the login scene.
- Validate schema and release metadata.
- Cache by release ID and support conditional requests.

### AS2 — FileManager integration
- Route HTTP requests through the configured asset server.
- Normalize slashes, Unicode, percent encoding, and aliases.
- Keep GRF/FileSystem fallback only for development mode.

### AS3 — Preflight and completeness
- Validate bootstrap, login, character-select, core UI, and initial-map groups.
- Produce machine-readable and human-readable reports.
- Block publication when a critical dependency is absent.

### AS4 — Remove player browsing
- Remove or hide GRF and data-folder selection from production UI.
- Replace it with a clear asset-server unavailable/error screen.

### AS5 — Patch and rollback
- Publish content-addressed objects.
- Change only the manifest pointer for releases.
- Roll back by selecting a previous manifest.

## Initial configuration contract

```json
{
  "schemaVersion": 1,
  "mode": "production",
  "assetServer": "https://assets.example.com/roweb/",
  "manifest": "manifests/current.json",
  "allowLocalImport": false,
  "requestTimeoutMs": 15000,
  "telemetryEndpoint": "/api/client-telemetry",
  "requiredGroups": ["bootstrap", "login", "ui-classic-core"]
}
```

## Manifest minimum contract

```json
{
  "schemaVersion": 1,
  "releaseId": "roweb-assets-2026.07.31.1",
  "generatedAt": "2026-07-31T12:00:00Z",
  "baseUrl": "https://assets.example.com/roweb/objects/",
  "compatibility": {
    "client": "roBrowserLegacy",
    "packetver": "locked-by-deployment",
    "encodingProfile": "roweb-th-cp949-v1"
  },
  "groups": {
    "bootstrap": ["ui.login.background", "ui.cursor.default"]
  },
  "assets": {
    "ui.login.background": {
      "path": "ab/cd/abcdef...",
      "sha256": "abcdef...",
      "size": 123456,
      "type": "image",
      "legacyAliases": ["data/texture/.../background.bmp"]
    }
  }
}
```

## Definition of done for the first release

- A player opens the website and is never asked to choose GRF/data files.
- The asset-server URL is controlled by deployment configuration.
- The client downloads and validates a manifest before login.
- Missing bootstrap assets stop startup with an actionable error.
- Non-critical missing assets use a visible placeholder and emit telemetry.
- A developer can publish a new manifest without rebuilding the JavaScript client.
- A previous manifest can be restored as a rollback.
