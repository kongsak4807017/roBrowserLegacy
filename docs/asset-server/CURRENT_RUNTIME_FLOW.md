# Current Runtime Asset Flow

## Development entry

`npm run dev` opens `applications/browser-examples/demo.html` through Vite. The page constructs `ROConfig` and starts `ROBrowser`.

Current asset-relevant configuration includes:

```text
development
remoteClient
grfList
saveFiles
skipIntro
server.remoteClient
```

## API shell

`applications/api/api.js` exposes legacy configuration for:

- GRF selection through `grfList`;
- hosted asset retrieval through `remoteClient`;
- deprecated browser filesystem persistence through `saveFiles`;
- local-client access behavior through `skipIntro` and development mode.

## Runtime I/O seam

`src/Core/FileManager.js` currently resolves assets in this general order:

```text
Electron/local file
-> Browser FileSystem
-> loaded GRF archives
-> remote HTTP client
```

This file is the primary integration seam for the new manifest-backed provider. It must not be rewritten wholesale during the first integration rounds.

## Target transition

```text
Deployment config
-> AssetBootstrap
-> AssetManifest
-> AssetResolver
-> PublishedAssetProvider
-> existing decoders/loaders
```

Development-only fallback may continue temporarily:

```text
PublishedAssetProvider
-> optional LegacyAssetProvider
-> local GRF/FileSystem
```

Production must use only the manifest-controlled provider and controlled placeholders/errors.

## Identified startup integration points

1. `applications/browser-examples/demo.html` — current Vite development shell and `ROConfig` assembly.
2. `applications/api/api.js` — public client API and application startup bridge.
3. Application-specific runtime bootstrap loaded by the API shell.
4. `src/Core/FileManager.js` — final asset retrieval seam.

The next round adds the coordinator only. Wiring it into these entry points is intentionally deferred to the subsequent startup-integration round.
