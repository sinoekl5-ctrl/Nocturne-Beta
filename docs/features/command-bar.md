# Command Bar / Omnibox

**Status:** browser-core matching and preview UI are implemented; real Chromium navigation and external search providers are not connected.

## Supported sources

The matcher searches the active Space's:

1. Open tabs.
2. Local history.
3. Pins/bookmarks.

It can also match local actions and commands. Results are ranked by exact title, title prefix, URL prefix, title substring, then other indexed text.

## Input modes

- Ordinary text searches tabs, history, bookmarks and actions.
- A URL or known local preview host produces an address result and obeys the active Clean Links mode.
- Arithmetic expressions use a small parser (no `eval`).
- Prefixing a query with `>` searches actions only.
- A named alias such as `doc.new` invokes the matching command.
- Unknown text becomes a search-preview request; no remote search is issued.

## Space scope

The UI passes only the active Space's tabs, history and pins. Private Spaces cannot retain history in the browser-core model. Persistent Space snapshots include their own history; private Space contents are excluded.

## API

```js
buildOmniboxSuggestions("research", {
  tabs: currentSpace.tabs,
  history: currentSpace.history,
  bookmarks: currentSpace.pins,
  actions,
  cleanLinksMode: "suggest",
});
```

The module is pure and does not navigate, execute commands, access the network, or read browser state. The prototype maps selected local results to preview actions only.

## Remaining Chromium integration

The browser process must provide real tab, bookmark and history data; record successful navigations into the right Space history; execute allow-listed actions; and dispatch selected HTTP(S) URLs through the safe navigation path. Browser tests must verify history isolation and ensure Private Spaces never record entries.
