# Feature specifications

This folder implements step 4 of the brief's merge workflow: one page per feature in the harvest matrix, written before implementation.

**Status of every spec here: DRAFT for owner review.** They were written from the brief, `docs/architecture.md`, the visual prototype and `prototype/core.mjs`. Nothing in them has been verified against a Chromium build. Any statement about Chromium internals (BrowserContext, tab lifecycle, storage partitions) is a hypothesis to be confirmed in the Phase 3 engine spike.

## Wave 1 (matrix score 20 or more, plus tab lifecycle)

| Spec | Matrix decision | Layer | Status |
|---|---|---|---|
| [Spaces](spaces.md) | Port (Crest model) | L2 | Draft |
| [Command bar](command-bar.md) | Adopt/Port (Ardia core ideas) | L2 / L3 | Draft |
| [Tab lifecycle and Recently Cleaned](tab-lifecycle.md) | Port | L2 | Draft |
| [Local Insights](insights.md) | Port (patterns only) | L5 | Draft |

Already in flight elsewhere: the Clean Links core (PR #2) and the WebUI bridge contract (PR #1). They are not re-specified here.

Adjacent shell specs (scores below the first-wave cutoff) are also included for early design review: [Split view](split-view.md) and [Peek](peek.md).\n\nStill not specified: importers, content blocking, onboarding.

## Conventions

- MUST / SHOULD / MAY are used in their usual specification sense.
- Numbers marked *tunable* are starting values, not requirements.
- Each spec has the same sections: purpose, decision, behavior, data stored, edge cases, privacy, accessibility and RTL, acceptance tests, open questions.
- Arabic and right-to-left behavior is part of every spec, not a later pass.
- No spec may require copying code, names, icons or text from the source projects. Behavior is described in Nocturne's own terms.
