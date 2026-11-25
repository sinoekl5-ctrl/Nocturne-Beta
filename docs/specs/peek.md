# Spec: Peek

- **Status:** Draft
- **Matrix:** Peek (preview link over page), Port, score 16
- **Layer:** L3 shell and interface; L2 owns navigation and tab routing
- **Source:** Nocturne brief §3.4 and §4.3 (printed pages 10 and 14)

## Purpose

Let a user inspect a link in a temporary overlay without immediately replacing the page they are reading.

## Decision

Peek is a lightweight, dismissible preview of a link above the current page. The brief establishes the preview-over-page concept but does not define activation, sizing, or dismissal. The interaction rules below are Nocturne proposals for review.

Peek is not a security sandbox. It loads real web content in the same Space and BrowserContext as the source page so sign-in and site behavior remain consistent.

## Activation and presentation

- The user can choose **Peek link** from the link context menu. A secondary keyboard gesture may be added after shortcut conflicts are checked; it is not required for the first implementation.
- Peek opens a compact, opaque panel anchored near the link when there is room; otherwise it repositions within the viewport. The panel never extends beyond the window.
- The panel has a visible site/title header, a clear close control, and actions **Open in tab** and **Open here**. The default action is preview only; it must not navigate the source page.
- The underlying page remains at its current scroll position and is not dimmed or tinted. The preview panel uses the current Space's surface tokens and a subtle focus treatment.
- The panel may show a loading state, page content, or a concise failure state. It must not show a blank panel without feedback.
- The preview is a real web view and may execute scripts, make network requests, set cookies, and display interactive content. Do not label it “safe”, “sandboxed”, or “private”.

## Dismissal and navigation

- Escape closes Peek and returns focus to the originating link.
- Clicking outside the panel closes it unless the pointer interaction is inside the preview or a panel control.
- The close button dismisses the preview. Closing Peek does not close the source tab.
- **Open in tab** promotes the preview URL to a normal tab in the same Space and focuses it.
- **Open here** navigates the source tab to the preview URL only after the user explicitly selects it.
- Following a link inside the preview updates the preview itself. It does not navigate the source tab.
- Opening a second Peek replaces the current one after the new target is confirmed; do not stack nested Peek panels.
- If the target cannot be previewed (for example, a browser-internal page, download, or unsupported scheme), offer the normal open action with a clear explanation instead.

## Data stored

Peek is ephemeral UI state: source tab ID, target URL, panel bounds, and return-focus target. It does not create a history entry merely by opening the preview. If the user chooses Open in tab or Open here, normal navigation/history rules apply.

Private Space Peek state is destroyed on close and on relock. It must not persist or sync.

## Privacy and security

- Peek inherits the source tab's Space and storage partition. It never silently opens a target in a different Space.
- Only navigable web schemes supported by the browser may load. Reject `javascript:`, `data:`, `file:`, and unsupported internal schemes as Peek targets.
- Show the canonical host in the panel header; handle internationalized hostnames consistently with the command bar's address display.
- A preview can perform the same web activity as a normal page. Apply the Space's content-blocking and permission settings; do not grant a new permission automatically from Peek.
- Permission prompts must identify that the request came from the preview and require explicit user action. Downloads and external-app handoffs are not auto-started from Peek.
- Do not expose a Private Space preview in standard-Space history, suggestions, or Insights.

## Edge cases

- If the source page navigates or closes while Peek is open, close the panel and release its preview contents.
- If the window loses focus while a Private Space Peek is open, relock the Space and destroy the preview contents.
- If the target redirects, update the host/title header to the final URL and keep the preview bounded to the same panel.
- If the panel is too small to use, offer Open in tab rather than shrinking controls below accessible sizes.
- If the user presses Back inside Peek, navigate the preview's own history; Escape still dismisses the panel.

## Accessibility and RTL

- The panel is a labeled dialog with focus moved to its header/close action on open and returned to the originating link on close.
- Escape closes the dialog. All controls are keyboard reachable and have visible focus.
- The panel's placement and anchor mirror logically in RTL, while URL text remains left-to-right where appropriate.
- Announce loading, navigation title changes, and failures without repeatedly announcing page content.

## Acceptance tests

- Open Peek from a link and verify the source URL and scroll position do not change.
- Escape, outside click, and close button dismiss the panel and restore focus.
- Open in tab and Open here perform the explicit, expected navigation.
- Link clicks inside the preview stay inside Peek; redirects update the displayed host.
- Reject unsafe/unsupported schemes and prevent automatic permission grants, downloads, and external-app launches.
- Verify Space storage and content-blocking inheritance, private relock cleanup, and no private history/suggestion leakage.
- Test keyboard-only operation, screen-reader dialog behavior, and RTL placement.

## Open questions

1. Should Peek activate from a dedicated context-menu item only, or also from a keyboard/mouse gesture?
2. Should preview contents be kept alive while the panel is hidden, or destroyed on dismissal? Proposed default: destroy on dismissal.
3. Which maximum panel dimensions and minimum usable size best fit the visual prototype?
4. Should “Open here” be included in v1, or should Peek only offer Open in tab?
