import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateExpression,
  isLikelyAddress,
  buildOmniboxSuggestions,
} from "../browser-core/omnibox.mjs";

const tabs = [
  { id: "studio", title: "The quiet work of making", url: "studio.preview" },
  { id: "api", title: "API reference", url: "docs.local/api" },
];
const history = [
  { id: "hist-old", title: "Old notes", url: "notes.local/old", visitedAt: "2026-11-20T10:00:00Z" },
  { id: "hist-new", title: "Recent research", url: "research.local", visitedAt: "2026-11-24T10:00:00Z" },
];
const bookmarks = [
  { id: "pin-library", title: "Library", url: "library.local" },
  { id: "pin-journal", title: "Research journal", url: "journal.local" },
];
const actions = [
  { id: "new-tab", title: "New tab", subtitle: "Create a tab", action: "new-tab", command: "doc.new", keywords: ["page"] },
  { id: "settings", title: "Open preferences", subtitle: "Appearance and layout", action: "settings", keywords: ["preferences"] },
];

test("calculator supports precedence, signs and parentheses without eval", () => {
  assert.equal(calculateExpression("2 + 3 * (4 - 1)"), 11);
  assert.equal(calculateExpression("-5 + 2"), -3);
  assert.equal(calculateExpression("10 / 4"), 2.5);
  assert.equal(calculateExpression("1 / 0"), null);
  assert.equal(calculateExpression("process.exit()"), null);
});

test("address detection recognizes HTTP URLs and local preview hosts", () => {
  assert.equal(isLikelyAddress("https://example.com/path"), true);
  assert.equal(isLikelyAddress("studio.preview"), true);
  assert.equal(isLikelyAddress("notes.local"), true);
  assert.equal(isLikelyAddress("some words"), false);
});

test("empty query returns useful current-Space recents", () => {
  const items = buildOmniboxSuggestions("", { tabs, history, bookmarks, actions, maxResults: 5 });
  assert.deepEqual(items.map((item) => item.kind), ["tab", "tab", "history", "history", "bookmark"]);
  assert.equal(items[2].id, "hist-new");
});

test("query ranks tabs, bookmarks and history by title relevance", () => {
  const items = buildOmniboxSuggestions("research", { tabs, history, bookmarks, actions });
  assert.equal(items[0].kind, "bookmark");
  assert.equal(items[0].id, "pin-journal");
  assert.equal(items.some((item) => item.kind === "history"), true);
});

test("URL search matches URL text and returns the correct source kind", () => {
  const items = buildOmniboxSuggestions("api", { tabs, history, bookmarks, actions });
  assert.equal(items[0].kind, "tab");
  assert.equal(items[0].id, "api");
});

test("command mode filters actions with a greater-than prefix", () => {
  const items = buildOmniboxSuggestions(">new", { actions, tabs, history, bookmarks });
  assert.equal(items.length, 1);
  assert.equal(items[0].action, "new-tab");
  assert.equal(items[0].reason, "Command");
});

test("named command aliases such as doc.new work without the prefix", () => {
  const items = buildOmniboxSuggestions("doc.new", { actions });
  assert.equal(items[0].action, "new-tab");
});

test("action keywords are searchable as part of normal matching", () => {
  const items = buildOmniboxSuggestions("preferences", { actions });
  assert.equal(items[0].action, "settings");
});

test("unknown text becomes a search preview request without network access", () => {
  const items = buildOmniboxSuggestions("quiet browser", { tabs, history, bookmarks, actions });
  assert.equal(items[0].kind, "search");
  assert.equal(items[0].query, "quiet browser");
});

test("Clean Links Suggest and Auto-clean modes are preserved", () => {
  const url = "https://example.com/page?utm_source=mail&id=3";
  const suggest = buildOmniboxSuggestions(url, { cleanLinksMode: "suggest" });
  assert.deepEqual(suggest.map((item) => item.kind), ["clean-link", "address"]);
  assert.equal(suggest[0].value, "https://example.com/page?id=3");
  const auto = buildOmniboxSuggestions(url, { cleanLinksMode: "auto-clean" });
  assert.equal(auto[0].value, "https://example.com/page?id=3");
  const disabled = buildOmniboxSuggestions(url, { cleanLinksMode: "disable" });
  assert.equal(disabled[0].value, url);
});

test("result cap is bounded even when caller requests an excessive limit", () => {
  const manyTabs = Array.from({ length: 30 }, (_, index) => ({
    id: "tab-" + index,
    title: "note " + index,
    url: "note-" + index + ".local",
  }));
  assert.equal(buildOmniboxSuggestions("", { tabs: manyTabs, maxResults: 999 }).length, 20);
});
