# Split View

**Status:** pure two/three-pane layout model implemented; Chromium WebContents composition is not wired.

## Contract

Split View contains two or three distinct tab IDs and tracks an orientation (`vertical` or `horizontal`) plus the active pane. It supports adding/removing panes, focusing a pane, changing orientation, and reordering panes. Removing a pane collapses the split when fewer than two remain.

The UI and browser host must enforce the two-to-three pane limit. The core model does not create native views, WebContents, navigation sessions or drag/drop behavior.

## API

```js
createSplitView(["tab-a", "tab-b"], "vertical");
addSplitPane(view, "tab-c");
activateSplitPane(view, "tab-b");
setSplitOrientation(view, "horizontal");
removeSplitPane(view, "tab-c");
```

## Tests

Tests cover the pane count, uniqueness, active pane fallback, orientation, reordering, and collapse after removing down to one pane.
