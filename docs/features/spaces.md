# Spaces (room model)

**Status:** browser-core metadata and lifecycle policy implemented; Chromium storage
isolation not implemented.

## Requirements from the project brief

A Space is a first-class room, not a tab folder. It owns a mood and a
content-blocking preference, and is intended to contain separate tabs, pins,
folders, cookies, site data, cache, history, permissions and credentials.

The five moods are Atelier, Gambit, Vigil, Drift and Ember. Content blocking
has three values: Off, Balanced and Strict.

Private Spaces are intended to use temporary storage, never enter normal
history or sync, and relock when the application loses focus.

## Browser-core API

`browser-core/spaces.mjs` provides pure state functions:

- `createSpaceDescriptor()`: validates the stable ID, display name, mood,
  privacy flag and content-blocking setting.
- `createSpaceRegistry()`: creates a registry with at least one non-private
  Space and one active Space.
- `addSpace()`, `activateSpace()`, `updateSpace()`, `removeSpace()`:
  immutable registry transitions.
- `closePrivateSpaces()`: removes all temporary Space descriptors and moves
  the active selection back to a persistent Space when necessary.
- `toPersistedSpaceSnapshot()`: returns only non-private Space metadata.

Privacy mode cannot be converted in-place by `updateSpace()`; moving from a
persistent profile to temporary storage requires an explicit migration and
cleanup implementation, not a flag flip.

## Important enforcement boundary

The `dataPolicy` on a descriptor is declarative. It does not create or isolate
Chromium profiles, BrowserContexts, cookie stores, cache, service workers,
permissions, downloads or history. Do not display a Space as secure merely
because this model marks it private.

The Chromium host must later map every persistent Space to its own browser
profile/BrowserContext and every Private Space to temporary storage. Browser
tests must prove that cookies, local storage, cache, service workers,
permissions, downloads and history cannot cross between Spaces. The host must
also implement focus-loss relocking and verified cleanup on close.

## Tests

`npm test` covers validation, duplicate IDs, immutable state transitions,
per-Space settings independence, private lifecycle policy, private snapshot
exclusion, active-Space fallback and protection against removing the final
persistent Space.
