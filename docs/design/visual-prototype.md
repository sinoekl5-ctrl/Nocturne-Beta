# Nocturne visual prototype specification

- **Status:** Initial design foundation; validate on real displays before treating values as final.
- **Reference:** Nocturne Browser Project Brief, Part 9 (pages 21–39).

## Prototype objective

Validate the Nocturne personality and the core sidebar-first interaction model before integrating the shell into a full Chromium build. The prototype should be independently runnable and should make no claim to be a functioning browser. Use placeholder page surfaces, not copied product screenshots or the supplied paintings.

## Design rules

- One warm focus/light source per view. The most recently interacted-with element owns the glow.
- Keep surfaces matte and opaque. Do not use frosted glass, glossy gradients, neon, or heavy shadows.
- Page content is never dimmed or tinted; the website remains the brightest object.
- Amber is a light, not a paint: reserve it for active/focused/saved states; avoid large amber fills and amber body text.
- Cold teal is for information and movement; oxblood is for small attention/error markers.
- Texture is subtle and optional. Grain and vignette must be switchable off and disabled in high-contrast mode.
- Do not convey state through color alone. Include shape, position, icon, text, and keyboard focus.

## Night palette tokens

| Token | Hex | Role |
|---|---|---|
| Void | `#0E0D0C` | Deepest window background |
| Umber | `#1B1814` | Sidebar and primary surfaces |
| Study | `#26221B` | Raised surfaces, hover, fields |
| Olive | `#3A3828` | Hairlines and strong borders |
| Slate | `#4B5456` | Disabled fills and inactive controls |
| Wind | `#7F9A9C` | Links, information, Drift accent |
| Mist | `#9CA8AA` | Secondary text |
| Bone | `#E2DACB` | Primary text and icons |
| Ember | `#C98A2B` | Single warm active/saved/focus accent |
| Oxblood | `#7A3B36` | Danger fills and attention markers |
| Rose Ash | `#C98F88` | Danger text on dark surfaces |
| Parchment | `#B7A27C` | Reading mode and quiet highlights |

## Space moods

| Mood | Surface direction | Accent | Texture/glow |
|---|---|---|---|
| Atelier | Umber / olive-brown | Ember | Medium grain, low glow |
| Gambit | Void with brown-black | Parchment | Medium grain; faint checker motif |
| Vigil | Near-monochrome Void | Bone only | Very low grain; no glow |
| Drift | Deep slate-blue black | Wind | Low horizontal grain; cold low glow |
| Ember | Brown-black | Stronger Ember | Low grain; warm medium glow |

## Core prototype surfaces

1. **Browser window:** dark matte frame; page surface remains neutral and undimmed.
2. **Sidebar:** target width 248–280 px; dock left or right; mirrored in RTL.
3. **Command bar:** address/search/tab/history entry and a visible focus state; calculator/quick actions can be represented as prototype examples.
4. **Pinned tiles:** compact square site placeholders; monochrome by default.
5. **Tabs and folders:** inactive, hover, active, sleeping, loading, nested-folder and empty states.
6. **Space switcher:** five mood indicators with keyboard-accessible names; selecting one changes the token set.
7. **Split view:** two- and three-pane layout concepts with a divider that reacts on hover/focus.
8. **Private Space:** explicit Private label, no glow, no grain; show a clear temporary-session boundary.

## Motion and accessibility

- Micro-interactions: 120 ms; standard tab/panel changes: 200 ms; Space changes: 320 ms.
- Respect reduced-motion preferences; replace sweeps and pulses with short fades.
- Focus ring: 2 px Ember outline with 2 px offset, plus a non-color shape/state change.
- Body text contrast target: at least 4.5:1; icons and meaningful outlines: at least 3:1.
- Include a high-contrast mode with no grain/vignette and a stronger focus ring.
- Pair Latin fonts with a tested Arabic companion. Mirror sidebar placement and motion direction for RTL.
- Review at low display brightness as well as normal brightness.

## Suggested typography

- Display: Cormorant Garamond or EB Garamond; Arabic companion: Amiri.
- Interface: Inter or system UI; Arabic companion: IBM Plex Sans Arabic or Noto Naskh Arabic.
- Addresses/code: JetBrains Mono.

Confirm the exact font files and their current licenses before bundling. The prototype may use system fallbacks until then.

## Prototype acceptance criteria

- All five moods can be switched without losing layout or legibility.
- Command bar, tabs, folders, pinned tiles, Space switcher, and split-pane states are represented.
- Exactly one warm focus per view is maintained.
- RTL layout mirrors correctly in the tested prototype.
- Keyboard focus, contrast, and reduced motion are demonstrable.
- No supplied painting or unlicensed third-party brand asset is included.


## Implemented prototype surface (25 November 2026)

The first runnable study is in `prototype/` and is intentionally dependency-free. Start it from the repository root with `npm run dev`, then open `http://127.0.0.1:4173`. It includes the sidebar, pins, folders, sample tabs, five Space mood switches, command palette, safe arithmetic suggestions, split-pane concept, reading mode, Day Study, high contrast, reduced motion, texture toggle, and an initial Arabic-label/RTL preview. The page area is a static sample and the address action changes only that preview.

The local demo does not create Chromium tabs, visit websites, store cookies/history, or isolate private profiles. No prototype state is a privacy/security boundary. The first visual acceptance review still needs a human check on real displays, low brightness, keyboard-only use and assistive technology. The Arabic labels are a starter translation, not complete product localization; confirm fonts, shaping, text direction and translated content before sign-off.
