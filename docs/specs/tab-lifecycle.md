# Spec: Tab lifecycle and Recently Cleaned

- **Status:** Draft
- **Matrix:** Tab sleeping and Recently Cleaned, Port, score 19
- **Layer:** L2, surfaced in L3

## Purpose

People who keep dozens of tabs open should not pay for them in memory and battery, and should never lose a tab by accident.

## Decision

Prefer Chromium's own freezing and discarding mechanisms over a custom implementation, and add Nocturne policy and interface on top. Whether those mechanisms are reachable from Nocturne's patch set is a Phase 3 question.

## States

| State | Meaning | Visual |
|---|---|---|
| Active | In the visible pane | Ember edge, Bone text |
| Background | Loaded, not visible | Mist text |
| Frozen | Scripts paused, memory kept | Mist text |
| Sleeping | Page unloaded, entry kept | Mist at 60 percent with a small moon glyph |
| Archived | Closed, recoverable | Not in the tab list; in Recently Cleaned |

Transitions are driven by idle time. The thresholds are *tunable*: starting values are freeze after 5 minutes in the background and sleep after 30 minutes, longer on devices with plenty of free memory.

## Exemptions (never frozen or slept automatically)

- Tab playing audio or video, including picture-in-picture.
- Tab with an active call, capture, or screen share.
- Tab with an upload or download in progress.
- Tab with unsaved form input detected by the engine.
- Pinned tabs, unless the user opts in.
- Any tab the user marked **Keep Loaded**.
- Every tab in the Space that is currently visible and every tab in a split view.

Sleeping restores the page from its URL and scroll position. The interface must say plainly when a page cannot restore its live state.

## Recently Cleaned

- A per-Space archive of closed and swept tabs: title, URL, favicon reference, closed time, and enough session data to restore.
- **Sweep** is the user-triggered action behind the prompt Heavy day? Sweep tabs you have not touched. Sweep proposes a list; the user confirms. Nothing is swept silently.
- Restore puts a tab back in its Space and folder when they still exist, otherwise in the Space root.
- Retention is *tunable*: default 30 days or 500 entries per Space, whichever comes first.
- **Private Spaces never write an archive.** Closing a tab there is final.

## Data stored

Archive entries live inside the owning Space's storage, so deleting the Space deletes its archive. Entries hold URLs, so they are history-class data and are covered by clear-history.

## Edge cases

- Sleeping a tab that is the opener of others: the relationship is kept so restoring still works.
- A Space switch hands the old Space's tabs to the same state machine. Switching must not wake sleeping tabs.
- Low-memory pressure may shorten the timers but never overrides exemptions.
- Restoring more than 20 tabs at once asks first and loads them staggered.
- Clock changes and system sleep must not make timers fire all at once.

## Privacy

No tab titles or URLs are used for anything except the archive and local ranking. Crash reports never include them.

## Accessibility, RTL and motion

Sleeping state is conveyed by text and glyph, not opacity alone. The sweep prompt is dismissible and can be switched off. Reduced motion replaces the wipe with a fade. Tab order and the moon glyph position mirror in right-to-left layouts.

## Acceptance tests

State machine unit tests with a fake clock (every transition, every exemption, timer drift after system sleep). Integration: memory drops measurably after sleeping a heavy page; restore returns URL and scroll position; no data loss after forced quit with sleeping tabs; private Space writes no archive; archive respects retention and Space deletion.

## Open questions

1. Default timers, after measuring real baselines (the implementation plan already defers performance budgets to measured data).
2. Whether pinned tabs are exempt by default.
3. Exact scope of restoring live state such as form input.
