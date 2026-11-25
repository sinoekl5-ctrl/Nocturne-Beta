# Spec: Split view

- **Status:** Draft
- **Matrix:** Split view (2–3 panes), Port, score 18
- **Layer:** L3 shell and interface; L2 owns pane/tab relationships
- **Source:** Nocturne brief §4.3, §9.4.2 and §9.7 (printed pages 14, 25 and 36)

## Purpose

Let a user compare or work across two or three live pages in one browser window without losing the sidebar-first Nocturne layout.

## Decision

Split view is a layout of existing tabs, not a separate browsing context or a new Space. Each pane hosts a normal tab from the active Space. Pane arrangement and active-pane identity are UI state; site data remains owned by the tab's Space.

The brief specifies two or three panes. This spec does not adopt Crest's four-pane behavior.

## Behavior

- The user can create a split from the active tab and choose a second tab, or drag a tab into the page area to form a split.
- A split contains **2 or 3 panes**. A fourth pane is never created; the action is disabled with a short explanation.
- Each pane is live and independently navigable. Navigation changes only the tab assigned to that pane.
- Panes are separated by a thin dark gap. The divider becomes Ember on hover and can be dragged by the gap to resize adjacent panes.
- The initial two-pane ratio is 50/50. Three panes start at equal widths. These ratios are tunable defaults, not hard requirements.
- Resizing updates the adjacent panes only and preserves the total available page width. A pane cannot be reduced below a tunable minimum width; if the window cannot fit all panes, the layout falls back to a single focused pane rather than clipping controls.
- Clicking a pane makes it active. Only the active pane receives the warm focus treatment; page content in inactive panes is not tinted or dimmed.
- Closing a pane removes it from the arrangement but does not close its tab unless the user separately chooses Close tab. When one pane remains, split mode ends.
- The user can rearrange pane order by dragging a pane handle. Dragging a tab into an occupied pane replaces that pane's tab only after a clear drop target is shown.
- Empty panes use the faint checker pattern described for Gambit at approximately 4% opacity. This is a decorative starting value and must not reduce text contrast.
- The active pane is reflected in the breadcrumb, address bar, and keyboard command target.

## Data stored

Per Space, persist only the arrangement: pane order, associated tab IDs, divider ratios, and active pane. Do not duplicate cookies, history, permissions, or site data in the split-view feature. If a tab is closed or unavailable, its pane becomes an empty pane with a recoverable action.

Private Space arrangement is temporary and must not be written to standard history, sync, or cross-Space state.

## Edge cases

- A tab already present in the split cannot appear in two panes unless a future explicit Duplicate tab action creates a separate tab.
- If a pane crashes or its renderer is discarded, retain the pane slot and offer Reload; do not silently close other panes.
- If a Space is switched, the current arrangement is saved for that Space and the new Space's arrangement is restored.
- If the window is resized below the minimum usable width, temporarily collapse to the active pane and show a restore-split affordance.
- If the user presses Close split, keep the active tab and return it to the ordinary single-page view.

## Privacy

- All panes in one split belong to the current Space. A split cannot silently combine tabs from different Spaces.
- A link opened in a pane uses that pane's tab and the same Space storage partition.
- Private Space rules remain in force: temporary storage, no history or sync, and relock on app focus loss. Split view must not keep a private pane visible after relock.
- Pane titles and URLs must not be exposed to another Space's command bar or Insights.

## Accessibility and RTL

- Pane focus is keyboard reachable and announced as “Pane 1 of 2”, etc.
- Divider is a separator with an accessible name and supports arrow-key resizing; use a tunable step and announce the resulting percentage.
- In RTL, pane order follows the logical inline direction. Keyboard resizing must be consistent with the visual direction and documented in the shortcut help.
- Do not rely on Ember color alone: divider hover/focus also changes thickness or shape.

## Acceptance tests

- Create 2-pane and 3-pane layouts; reject a fourth pane.
- Navigate each pane independently and verify tab/Space ownership.
- Drag divider to minimum and maximum; verify neighboring widths remain valid.
- Close a pane and confirm remaining tabs stay open; close split and preserve the active tab.
- Switch Spaces and restore independent arrangements without cross-Space leakage.
- Test narrow-window fallback, keyboard-only focus/resizing, screen-reader pane announcements, and RTL ordering.
- Verify the website pixels are not dimmed or tinted by inactive-pane styling.

## Open questions

1. Final minimum pane width and divider keyboard step.
2. Whether pane arrangements restore across app restart in v1 or only during the session.
3. Whether tab drag/drop into a pane is the primary creation gesture or a secondary shortcut.
