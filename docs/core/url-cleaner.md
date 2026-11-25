# URL Cleaner core contract

- **Layer:** L2 — browser core logic
- **Status:** pure helper implemented and unit-tested; local prototype preferences and suggestion flow are wired; real browser navigation/settings integration is not implemented.
- **Reference:** project feature matrix specifies Disable / Suggest / Auto-clean modes.

## Contract

`cleanTrackingUrl(input, { mode })` is a pure function. It never navigates, makes network requests, edits browser history or changes persisted settings.

| Mode | Candidate result | Navigation result |
|---|---|---|
| Disable | Original input | Original input |
| Suggest | Cleaned candidate when eligible | Original input; UI may offer the candidate |
| Auto | Cleaned candidate when eligible | Cleaned candidate |

Unknown mode values fall back to Suggest, never Auto. The result reports changed, removedParams, shouldSuggest and skippedReason so a caller can make the user-facing decision explicit. The per-Space preference helpers createUrlCleanerPreferences, getUrlCleanerMode and setUrlCleanerMode validate all five Space modes and return immutable updates.

## Removal policy

- Remove known click/analytics identifiers such as `utm_*`, `fbclid`, `gclid`, `msclkid`, `ttclid`, `twclid`, selected campaign IDs, and selected email-marketing identifiers.
- Parameter matching is case-insensitive and percent-decoded before matching.
- Remove every occurrence of a recognized tracking key.
- Preserve unknown parameters, repeated useful values, path, fragment and the raw representation of unrelated query segments.
- Do not guess that generic names such as `ref`, `source` or `campaign` are tracking-only. They may carry application meaning.
- Leave known signed URL families untouched (AWS/Google signature keys, CloudFront signature fields, and Akamai token fields), because query mutation can invalidate signatures.
- Only absolute HTTP and HTTPS URLs are eligible. Invalid URLs and other schemes are passed through unchanged with an explicit reason.

The tracker list is intentionally conservative. It is not a complete blocklist and should be reviewed against real browser telemetry-free fixtures and user feedback before broad release.

## Prototype integration (implemented)

The visual prototype now includes a three-mode selector under Preferences / Privacy. Each Space keeps a separate preference in the prototype origin's local storage; invalid or unknown stored values fall back to Suggest. This preference store is one prototype-wide origin, not Chromium profile isolation.

When a sample address is selected:

- Disable keeps the supplied address unchanged.
- Suggest retains the original preview address and presents explicit Use cleaned preview / Keep original actions.
- Auto-clean changes only the displayed local preview address.

The control and suggestion text have English and starter Arabic labels. The helper remains pure; the prototype is the caller that stores preferences.

## Remaining browser integration gates

1. Wire this helper to the real omnibox/navigation decision point only after the Chromium shell exists.
2. Replace prototype local storage with the approved per-Space/profile preference storage in the browser.
3. In Suggest mode, never silently replace the submitted navigation URL; preserve an explicit action in the real shell.
4. Add navigation tests covering redirects, signed downloads, duplicate parameters, internationalized URLs, history/bookmarks and POST/form URLs.
5. Keep the cleaner out of URL signing/canonicalization code and never rewrite an already-started request.
6. Include a reviewed tracker-list version and regression fixtures with each release.

## Boundaries

This helper is not a browser network interceptor, extension, ad blocker or security boundary. The static prototype applies it only when selecting a simulated address; no external website is opened and no live network navigation is cleaned.
