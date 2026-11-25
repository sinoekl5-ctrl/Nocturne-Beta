# Spec: Spaces

- **Status:** Draft
- **Matrix:** Crest model, Port, score 20
- **Layer:** L2 (browser core), surfaced in L3 and L5

## Purpose

A Space is a sealed browsing room. Work, research, home and private browsing do not share cookies, history or permissions, and each looks different so the user always knows which room they are in.

## Decision

One Space maps to one Chromium profile-level storage boundary (provisionally one BrowserContext or Profile per Space). Version 1 has **no Sub-Spaces**. The brief and `docs/architecture.md` both defer them, and they must never weaken the default isolation.

## The Space object

| Field | Type | Notes |
|---|---|---|
| `id` | random opaque string | Never derived from the name. Used for the storage directory. |
| `name` | string, 1 to 40 characters | Shown in the switcher. Not unique. |
| `mood` | `atelier` / `gambit` / `vigil` / `drift` / `ember` | Matches `SPACE_MOODS` in `prototype/core.mjs`. |
| `contentBlocking` | `off` / `balanced` / `strict` | Default `balanced`. |
| `kind` | `standard` / `private` | `private` is fixed at creation and cannot be changed later. |
| `createdAt` | UTC timestamp | |
| `order` | integer | Position in the switcher. |

The prototype currently sets `private = true` automatically for the `vigil` mood. The spec separates the two: **mood is visual, kind is a security property.** A standard Space MAY use the Vigil mood, and a private Space SHOULD default to it.

## Behavior

1. **First run** creates one standard Space named by the user (default name provisional) with the Atelier mood.
2. **Create** asks for a name, a mood and a kind. Content blocking defaults to Balanced.
3. **Switch** changes the visible Space with the 320 ms room transition from the brief. Tabs of the previous Space are handed to the tab lifecycle (see tab-lifecycle.md) and are not closed.
4. **Rename** and **change mood** are instant and never touch stored site data.
5. **Delete** requires an explicit confirmation that states what will be erased (tabs, history, cookies, saved sign-ins). Deletion MUST remove the Space's whole storage directory, not only the index entry. The last remaining standard Space cannot be deleted.
6. **Reorder** is drag or keyboard, and persists.

## What each Space owns

Cookies, local and session storage, IndexedDB, cache, service workers, permissions, downloads list, history, tabs, pins, folders, closed-tab archive, saved credentials, per-Space settings, and the content-blocking mode.

Open question: extensions. Two options are possible, per-Space installs (strong isolation, more setup) or shared installs with per-Space enablement. This must be decided before the isolation tests are written. Default proposal: shared installs, per-Space enablement, extension storage isolated per Space.

## Private Spaces

- Use temporary storage only. Nothing is written to the normal history, the archive or any export.
- On close (last tab closed, Space closed or app quit) all storage is destroyed. A crash MUST NOT leave readable private data behind on next start: the temporary directory is wiped on startup before any window opens.
- Excluded from Insights entirely (see insights.md).
- The brief proposes relocking when the app loses focus. This is **not** specified as a requirement yet. It needs a usability and threat-model review first, because relocking on every focus change would be hostile to normal use.
- The visual treatment is Void only, no glow, no grain, with a Mist label reading Private.

## Link routing (v1 scope)

A per-Space list of URL rules (host pattern to Space) MAY be added. If present, rules are matched on the parsed host, never on a substring of the whole URL, and a match opens the link in the target Space with a visible, dismissible notice. Quick Window routing is deferred.

## Data stored

A small index file (Space objects only, no browsing data) plus one directory per Space. The index never contains URLs.

## Edge cases

- Two Spaces with the same name are allowed. The switcher shows mood color as well as the name.
- Disk full during Space creation: creation fails cleanly and no partial directory remains.
- App killed during deletion: on next start the deletion resumes, so a half-deleted Space does not reappear.
- Name containing right-to-left text, emoji or control characters: stored as given, control characters stripped, displayed with correct bidi isolation.
- Space limit: tunable soft limit of 12 with a clear message, not a silent failure.

## Privacy

No Space data leaves the machine. Space names are never sent anywhere, including in crash reports.

## Accessibility and RTL

The switcher is a labeled list reachable by keyboard, announces name, mood and kind, and does not rely on color alone. In right-to-left layouts the dots mirror and the transition direction mirrors.

## Acceptance tests

Automated leakage matrix, run on Windows, Linux and macOS. For each storage type, write a marker in Space A and prove it is invisible from Space B, and survives a restart in A.

1. Cookies (including third-party)
2. localStorage and sessionStorage
3. IndexedDB
4. Cache (HTTP cache and Cache API)
5. Service workers and push registrations
6. Permissions (camera, location, notifications)
7. History and downloads list
8. Saved credentials
9. Extension storage

Additional tests: private Space leaves nothing on disk after close, after forced quit, and after a simulated crash; deleting a Space removes its directory; index file contains no URLs.

## Open questions

1. Extension model (above).
2. Is relocking on focus loss wanted at all, and as an option or a default?
3. Does the family of Chromium storage primitives allow one BrowserContext per Space without unacceptable memory cost? The answer comes from the Phase 3 spike.
4. Are Sub-Spaces ever needed?
