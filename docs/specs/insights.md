# Spec: Local Insights

- **Status:** Draft
- **Matrix:** urlshortener-ui dashboard patterns, Port, score 20
- **Layer:** L5 (internal page), data collected in L1 and L2

## Purpose

A calm internal page that shows the user what Nocturne did for them: trackers kept out, time spent per Space, tabs put to sleep. It is a mirror for the user, not analytics for anyone else.

## Decision

All data is collected, stored and displayed locally. There is no upload path, no account and no remote dependency. Only the layout and interaction patterns of the reference dashboard are borrowed (date-range presets, breakdown lists, color-coded tags). No code or visuals are copied.

## Metrics (v1)

| Metric | Definition | Granularity |
|---|---|---|
| Trackers blocked | Count of blocked requests classed as tracking | Per Space, per day |
| Clean links | Count of URLs where tracking parameters were removed or suggested for removal | Per Space, per day |
| Time per Space | Seconds the browser window was focused on that Space | Per Space, per day |
| Tabs slept | Count of tabs moved to Sleeping | Per Space, per day |
| Tabs swept | Count of tabs archived by Sweep | Per Space, per day |

Counts are aggregates. **No URLs, page titles, search terms or per-site timings are stored.** A top blocked domains list is a separate, **off by default** option, because domains are browsing data.

## Page layout

- Date-range presets: 7 days, 30 days, 90 days, custom.
- One summary row of the five metrics for the range.
- Per-Space breakdown with the Space's mood color as a tag, never as the only identifier.
- Time per Space as a ring (the Vigil dial language). Every chart has a table alternative.
- Empty state, in the Nocturne voice: Nothing here yet.
- Voice example for the blocked count: 17 trackers kept out.

## Data stored

A small local database of daily counters: date, Space id, metric, value. Retention is *tunable* (default 90 days), with one control to delete all Insights data and one to switch collection off. Counters are written in batches, not per request, to avoid disk churn.

## Exclusions

- **Private Spaces are excluded entirely.** Nothing is counted, not even aggregates, so the existence and activity of a private room leaves no trace.
- Deleting a Space deletes its counters.
- Insights data is never included in crash reports, sync or default exports.

## Edge cases

- Clock changes: counters are keyed by local calendar date and tolerate backward jumps without negative values.
- Counter overflow or corrupted store: reset the store and show a calm notice; never block startup.
- A very large blocked count: abbreviate for display, keep exact values for screen readers.
- Time per Space counts only when the window is focused and the user is not idle for longer than a tunable limit (default 5 minutes).

## Privacy review items

Even aggregate counters can reveal habits to someone with access to the device. This is why Private Spaces are excluded, why collection can be turned off, and why detailed lists are opt-in.

## Accessibility and RTL

Summary, tables and charts are readable by screen readers, charts have text equivalents, and no meaning depends on color alone. Layout and chart direction mirror in right-to-left, while numbers keep correct digit shaping for the user's locale.

## Acceptance tests

Unit tests for counter batching, date handling and retention pruning. Integration tests that a blocked request increments exactly one counter, that no URL or title appears anywhere in the store (a test that scans the database), that private Spaces write nothing, and that Delete all leaves an empty store. Accessibility checks for the ring and the table alternative.

## Open questions

1. Whether the opt-in top domains list ships in v1.
2. Retention default.
3. Whether Insights is reachable from inside a Private Space (proposal: no).
