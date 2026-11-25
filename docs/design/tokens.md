# Design tokens

Implements the brief's section 9.5 as machine-checked files.

| File | Role |
|---|---|
| `design/tokens.json` | Source of truth: palettes, mood values, dimensions, declared contrast pairs |
| `design/tokens.css` | CSS custom properties for Night, Day, high contrast, the five moods, private Spaces, RTL and reduced motion |
| `design/contrast.mjs` | Dependency-free WCAG contrast helper |
| `tests/tokens.test.mjs` | Keeps JSON and CSS in sync and enforces contrast rules (runs with `npm test`) |

## What the tests prove

- Every contrast ratio the brief publishes (section 9.5, contrast table) is reproduced within 0.1. All 15 published pairs match.
- Every declared text pair is at least 4.5:1 and every declared UI pair is at least 3:1.
- Each Space mood accent keeps at least 4.5:1 on Void, Umber and Study.
- Decorative tokens (Slate, Olive, Hairline) are never declared as text or UI foregrounds.
- The CSS and JSON palettes cannot drift apart, and no `var(--x)` can reference an undeclared property.

These are flat-color calculations on sRGB values. They do not account for grain, vignette, display brightness or anti-aliasing, so they do not replace the real-screen review the brief asks for.

## Findings

1. **Ember Dark on Linen is 4.37:1 and fails AA for text.** The brief checks Ember Dark only on Page. Do not put Ember Dark text or links on Linen (raised Day surfaces). Recorded in the `avoid` list.
2. **Slate is 2.50:1 on Void and 2.28:1 on Umber.** Fine for disabled controls. The component spec also lists Slate for scrollbars, which are not disabled, so either scrollbar thumbs use a lighter token or the team accepts the shortfall. Needs an owner decision.
3. **Vigil grain conflict.** The mood table says very low grain, the Private Space spec says no grain. Resolved by separating mood from kind: the Vigil mood uses a very low value, and `[data-space-kind="private"]` forces grain and glow to 0. This matches `docs/specs/spaces.md`.
4. **Divergence from the brief's CSS snippet.** The snippet redefines `--ember` inside the Vigil mood. Here palette tokens stay constant and moods change `--accent`, so a mood can never silently recolor a status color.

## Proposals that are not in the brief

- The semantic role layer (`--bg`, `--surface`, `--text`, `--accent` and so on). Night follows the brief's role table. The Day mapping is new, and Day links use Ember Dark.
- Numeric grain and glow values per mood. They translate the qualitative levels (medium, low, very low, none) and should be tuned on a real screen.
- The Ember mood is described as a stronger ember accent, but the brief gives no separate hex, so it uses the standard Ember token.
- Mood background colors are not tokenized because the brief describes them only in words.

## Using the tokens

Link `design/tokens.css`, set `data-theme`, `data-mood`, `data-contrast` and `data-space-kind` on the root element, and style components with the semantic roles, not the raw palette. The prototype's stylesheet is not migrated in this change.
