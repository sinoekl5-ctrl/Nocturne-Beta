# Tab lifecycle: sleeping and Recently Cleaned

**Status:** pure browser-core policy implemented and tested; Chromium process freezing and tab archival are not wired.

## Sleeping policy

The core evaluates a tab against a caller-supplied idle threshold. It never invents a time threshold. A tab is protected when it is active, pinned, Keep Loaded, audible, playing media, or has a before-unload handler. A tab with no activity timestamp or a future timestamp is not considered safe to sleep.

The browser host must re-check protection flags in the browser process immediately before freezing or discarding the renderer, because page audio/media/beforeunload state can change after the policy evaluation.

## Recently Cleaned

`sweepUntouchedTabs()` selects the oldest untouched eligible tabs, preserves protected tabs, and returns archive entries containing the full tab record for later restoration. By default it keeps at least one tab open. It is a recoverable policy decision, not a delete operation.

The host must persist the archive in the owning Space and provide a UI for restore/clear. This module does not close WebContents or free Chromium processes.

## API

```js
evaluateTabSleep(tab, { now, idleThresholdMs });
markTabSleeping(tab, { now, idleThresholdMs });
sweepUntouchedTabs(tabs, { now, untouchedThresholdMs });
restoreRecentlyCleanedEntry(entry);
```

All timestamps and thresholds are supplied by the caller, so the product can choose and document the actual policy. No silent 30-minute or other default is assumed.

## Tests

The test suite covers protected tabs, missing/future activity timestamps, sleeping/waking transitions, oldest-first cleanup, keeping one tab open, and recovery from a Recently Cleaned entry.
