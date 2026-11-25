# URL Cleaner core contract

- **Layer:** L2 — browser core logic
- **Status:** pure helper implemented and unit-tested; browser navigation/settings integration is not implemented.
- **Reference:** project feature matrix specifies Disable / Suggest / Auto-clean modes.

## Contract

`cleanTrackingUrl(input, { mode })` is a pure function. It never navigates, makes network requests, edits browser history or changes persisted settings.

| Mode | Candidate result | Navigation result |
|---|---|---|
| Disable | Original input | Original input |
| Suggest | Cleaned candidate when eligible | Original input; UI may offer the candidate |
| Auto | Cleaned candidate when eligible | Cleaned candidate |

Unknown mode values fall back to Suggest, never Auto. The result reports `changed`, `removedParams`, `shouldSuggest` and `skippedReason` so a caller can make the user-facing decision explicit.

## Removal policy

- Remove known click/analytics identifiers such as `utm_*`, `fbclid`, `gclid`, `msclkid`, `ttclid`, `twclid`, selected campaign IDs, and selected email-marketing identifiers.
- Parameter matching is case-insensitive and percent-decoded before matching.
- Remove every occurrence of a recognized tracking key.
- Preserve unknown parameters, repeated useful values, path, fragment and the raw representation of unrelated query segments.
- Do not guess that generic names such as `ref`, `source` or `campaign` are tracking-only. They may carry application meaning.
- Leave known signed URL families untouched (AWS/Google signature keys, CloudFront signature fields, and Akamai token fields), because query mutation can invalidate signatures.
- Only absolute HTTP and HTTPS URLs are eligible. Invalid URLs and other schemes are passed through unchanged with an explicit reason.

The tracker list is intentionally conservative. It is not a complete blocklist and should be reviewed against real browser telemetry-free fixtures and user feedback before broad release.

## Integration gates

1. Wire this helper to the real omnibox/navigation decision point only after the Chromium shell exists.
2. Add per-Space setting storage and an explicit preference UI for Disable / Suggest / Auto-clean.
3. In Suggest mode, never silently replace the submitted navigation URL; show a clear action that opens the candidate.
4. Add navigation tests covering redirects, signed downloads, duplicate parameters, internationalized URLs, history/bookmarks and POST/form URLs.
5. Keep the cleaner out of URL signing/canonicalization code and never rewrite an already-started request.
6. Include a reviewed tracker-list version and regression fixtures with each release.

## Boundaries

This helper is not a browser network interceptor, extension, ad blocker or security boundary. It is not wired into the static prototype's address action yet. No claim is made that any live website navigation is currently cleaned.
