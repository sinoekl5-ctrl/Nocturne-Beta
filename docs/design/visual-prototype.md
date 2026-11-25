# Nocturne visual prototype specification

- Status: Initial design foundation; validate on real displays.
- Source: Project brief Part 9 (pages 21–39).

## Objective
Validate the Nocturne mood and sidebar-first interactions before integrating the shell into a full
Chromium build. The prototype is a design-validation surface, not a functioning browser. Use neutral
placeholder page surfaces, not copied product screenshots or the private paintings.

## Design rules
- One warm focus/light source per view; the most recently interacted element owns the glow.
- Matte, opaque surfaces. No frosted glass, glossy gradients, neon, or heavy shadows.
- Page content is never dimmed or tinted.
- Amber is a light, not a paint: reserve it for active/focused/saved states, not large fills or body text.
- Wind/cold teal means information and movement; oxblood is for small danger/attention markers.
- Grain/vignette are subtle, optional, and disabled in high-contrast mode.
- Never convey state by color alone; include shape, position, icon/text, and keyboard focus.

## Night tokens
| Token | Hex | Role |
|---|---|---|
| Void | #0E0D0C | Deepest background |
| Umber | #1B1814 | Sidebar and primary surfaces |
| Study | #26221B | Raised surfaces, hover, fields |
| Olive | #3A3828 | Hairlines and strong borders |
| Slate | #4B5456 | Disabled/inactive controls |
| Wind | #7F9A9C | Links, information, Drift accent |
| Mist | #9CA8AA | Secondary text |
| Bone | #E2DACB | Primary text and icons |
| Ember | #C98A2B | Single warm focus accent |
| Oxblood | #7A3B36 | Danger/attention fill |
| Rose Ash | #C98F88 | Danger text |
| Parchment | #B7A27C | Reading mode and quiet highlights |

## Five moods
- Atelier: umber/olive-brown, Ember accent, medium grain, low glow; default work Space.
- Gambit: Void and brown-black, Parchment accent, subtle checker rhythm; research.
- Vigil: near-monochrome Void, Bone only, very low grain, no glow; private/night.
- Drift: deep slate-blue, Wind accent, low horizontal texture; media/leisure.
- Ember: brown-black, stronger Ember accent, warm low glow; home/saved.

## Core surfaces
1. Browser window with neutral, untinted page area.
2. 248–280 px sidebar, dockable left/right and mirrored for RTL.
3. Command bar for address/search/tab/history; visible Ember focus.
4. Pinned square tiles and tab/folder states (inactive, hover, active, sleeping, loading, nested,
   empty).
5. Space switcher with accessible names and five mood states.
6. Two/three-pane split view and draggable divider concept.
7. Explicit Private Space state with temporary-session boundary, no grain/glow.

## Motion and accessibility
Micro 120 ms; standard tab/panel 200 ms; Space change 320 ms. Respect reduced-motion preferences
with short fades. Focus: 2 px Ember outline plus 2 px offset and a non-color state change. Target
body contrast >= 4.5:1; meaningful icons/outlines >= 3:1. Include high contrast with no grain or
vignette. Test Arabic fonts, RTL mirroring, focus movement, and sweep direction. Review at low
display brightness.

## Typography direction
Display: Cormorant Garamond or EB Garamond (Arabic companion Amiri).
Interface: Inter or system UI (Arabic companion IBM Plex Sans Arabic or Noto Naskh Arabic).
URLs/code: JetBrains Mono. Verify exact font files and current licenses before bundling.

## Acceptance
All five moods switch correctly; core sidebar/command/tab/folder/split states are demonstrable;
one warm focus per view; RTL/keyboard/reduced-motion/contrast checks pass; no supplied paintings or
unlicensed third-party brand assets are shipped.
