import test from "node:test";
import assert from "node:assert/strict";
import { buildSuggestions, calculateExpression, createSpaceState, isLikelyAddress } from "../prototype/core.mjs";

const items = [
  { id: "studio", title: "The quiet work of making", subtitle: "studio.preview", kind: "tab" },
  { id: "settings", title: "Open preferences", subtitle: "Change appearance", kind: "action" },
];

test("calculator handles precedence and parentheses without eval", () => {
  assert.equal(calculateExpression("2 + 3 * (4 - 1)"), 11);
  assert.equal(calculateExpression("10 / 4"), 2.5);
  assert.equal(calculateExpression("1 / 0"), null);
  assert.equal(calculateExpression("process.exit()"), null);
});

test("address detection recognizes local preview hosts and web URLs", () => {
  assert.equal(isLikelyAddress("https://example.com/path"), true);
  assert.equal(isLikelyAddress("studio.preview"), true);
  assert.equal(isLikelyAddress("notes.local"), true);
  assert.equal(isLikelyAddress("some words"), false);
});

test("command suggestions produce calculator, address and local matches", () => {
  assert.equal(buildSuggestions("5*5", items)[0].value, "25");
  assert.equal(buildSuggestions("https://example.com", items)[0].kind, "address");
  assert.equal(buildSuggestions("preferences", items)[0].id, "settings");
  assert.equal(buildSuggestions("", items).length, 2);
});

test("Space model normalizes unknown mood and makes Vigil private", () => {
  assert.deepEqual(createSpaceState("unknown"), { mood: "atelier", private: false, tabs: [], pins: [] });
  assert.equal(createSpaceState("vigil").private, true);
});


test("Clean Links modes feed the command bar without changing Suggest navigation", () => {
  const url = "https://example.com/story?utm_source=mail&id=9";
  const suggested = buildSuggestions(url, items, { cleanLinksMode: "suggest" });
  assert.equal(suggested[0].kind, "clean-link");
  assert.equal(suggested[0].value, "https://example.com/story?id=9");
  assert.equal(suggested[1].kind, "address");
  assert.equal(suggested[1].value, url);

  const automatic = buildSuggestions(url, items, { cleanLinksMode: "auto-clean" });
  assert.equal(automatic[0].kind, "address");
  assert.equal(automatic[0].value, "https://example.com/story?id=9");

  const disabled = buildSuggestions(url, items, { cleanLinksMode: "disable" });
  assert.equal(disabled[0].value, url);
});
