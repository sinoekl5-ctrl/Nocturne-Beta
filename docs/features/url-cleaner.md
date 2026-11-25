# Clean Links

**Status:** pure browser-core URL cleaner implemented and covered by Node tests.
The user preference is not yet wired to Chromium navigation or the settings UI.

## User-facing modes

The project brief defines three modes:

| Mode | Behavior |
|---|---|
| Disable | Do not inspect or change the supplied URL |
| Suggest | Detect known tracking parameters and show a clean candidate; keep the original URL for navigation |
| Auto-clean | Return the clean candidate for the navigation caller to use |

## Conservative removal policy

The initial implementation removes the conventional `utm_*` family and a small
explicit set of common click/marketing identifiers, including `gclid`,
`fbclid`, `msclkid`, `wbraid`, `gbraid`, `ttclid`, `mc_cid`, and `mc_eid`.

It deliberately keeps ambiguous parameters such as `ref`, `source`, and `id`.
Removing those could break partner attribution, routing, or application behavior.
Unknown parameters are preserved.

The cleaner works locally. It makes no network requests. It preserves the raw
encoding and order of all retained query pairs and keeps URL fragments. It
rejects malformed input, non-HTTP(S) schemes, URL-embedded credentials, and
inputs larger than 8 KiB.

## API

```js
import { cleanLink } from "./browser-core/url-cleaner.mjs";

const result = cleanLink("https://example.com/?utm_source=mail&id=7", {
  mode: "suggest",
});
// result.url        -> original URL (no automatic navigation change)
// result.cleanedUrl -> https://example.com/?id=7
// result.action     -> "suggested"
```

The caller must honor `result.url` for navigation. The module itself never
navigates, redirects, fetches, or changes browser state.

## Tests

Run `npm test` to cover all three modes, tracker matching, repeated parameters,
encoded names, preservation of business parameters, raw query encoding,
fragments, malformed URLs, unsafe schemes, embedded credentials, and size
limits.

## Integration still required

1. Add a per-Space preference with the three modes.
2. Call this module from the browser-process navigation pipeline, before commit.
3. In Suggest mode, show a non-blocking clean-link affordance without silently
   changing navigation.
4. In Auto-clean mode, preserve the user's original URL for back/forward and
   debugging semantics, and test redirects and POST/form navigations separately.
5. Add Chromium browser tests; these Node tests validate only pure URL logic.
