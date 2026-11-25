# Spaces (room model)

**Status:** browser-core metadata, per-Space collections, and visual preview wiring are implemented; Chromium storage isolation is not implemented.

## Requirements from the project brief

A Space is a first-class room, not a tab folder. It owns a mood and a content-blocking preference, and is intended to contain separate tabs, pins, folders, cookies, site data, cache, history, permissions and credentials.

The five moods are Atelier, Gambit, Vigil, Drift and Ember. Content blocking has three values: Off, Balanced and Strict.

Private Spaces are intended to use temporary storage, never enter normal history or sync, and relock when the application loses focus.

## Browser-core API

`browser-core/spaces.mjs` provides pure state functions:

- `createSpaceDescriptor()` and `createSpaceRegistry()`: validate identifiers, names, mood, privacy, content-blocking mode, and independent collections.
- `addSpace()`, `activateSpace()`, `updateSpace()`, `removeSpace()`: immutable registry transitions.
- `addTabToSpace()`, `addPinToSpace()`, `addFolderToSpace()` and matching remove functions: maintain distinct collections per Space. Tabs may carry a `folderId`.
- `closePrivateSpaces()`: removes all temporary Space descriptors and moves the active selection back to a persistent Space when necessary.
- `toPersistedSpaceSnapshot()`: returns only non-private Space metadata and collections; private tabs, pins and folders are omitted.

## Visual prototype

The sidebar now renders its tab groups and pinned tiles from the active Space's own registry record. Switching Spaces swaps those collections instead of sharing one global DOM list. Users can create named Spaces, tabs, pins and folders, and choose a content-blocking preference per Space.

These remain preview data only: no Chromium profile/BrowserContext is allocated, no website is loaded, and no actual content filtering occurs.

## Important enforcement boundary

The `dataPolicy` on a descriptor is declarative. It does not create or isolate Chromium profiles, BrowserContexts, cookie stores, cache, service workers, permissions, downloads or history. Do not display a Space as secure merely because this model marks it private.

The Chromium host must map every persistent Space to its own browser profile/BrowserContext and every Private Space to temporary storage. Browser tests must prove that cookies, local storage, cache, service workers, permissions, downloads and history cannot cross between Spaces. The host must also implement focus-loss relocking and verified cleanup on close.

## Tests

`npm test` covers descriptor validation, duplicate IDs, independent tab/pin/folder collections, folder associations, immutable state transitions, per-Space settings, private lifecycle policy, private snapshot exclusion, active-Space fallback and protection against removing the final persistent Space.
