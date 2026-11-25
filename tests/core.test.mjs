import test from "node:test";
import assert from "node:assert/strict";
import { buildSuggestions, calculateExpression, createSpaceState, getAdjacentTabId, getFallbackTabId, isLikelyAddress } from "../prototype/core.mjs";

const items = [
  { id: "studio", title: "The quiet work of making", subtitle: "studio.preview", kind: "tab" },
  { id: "new-tab", title: "New tab", subtitle: "Open a blank tab", kind: "action", action: "new-tab" },
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
  assert.equal(buildSuggestions("new tab", items)[0].action, "new-tab");
  assert.equal(buildSuggestions("", items).length, 3);
});

test("Space model normalizes unknown mood and makes Vigil private", () => {
  assert.deepEqual(createSpaceState("unknown"), { mood: "atelier", private: false, tabs: [], pins: [] });
  assert.equal(createSpaceState("vigil").private, true);
});


test("closing a tab prefers its right neighbor, then the left", () => {
  assert.equal(getFallbackTabId(["a", "b", "c"], 1), "c");
  assert.equal(getFallbackTabId(["a", "b", "c"], 2), "b");
});

test("tab fallback safely handles empty or invalid selection", () => {
  assert.equal(getFallbackTabId([], 0), null);
  assert.equal(getFallbackTabId(["a", "b"], -1), "a");
  assert.equal(getFallbackTabId(["a", "b"], 8), "a");
});


test("tab navigation wraps in either direction", () => {
  assert.equal(getAdjacentTabId(["a", "b", "c"], "a", -1), "c");
  assert.equal(getAdjacentTabId(["a", "b", "c"], "c", 1), "a");
  assert.equal(getAdjacentTabId(["a", "b", "c"], "b", 1), "c");
});

test("tab navigation handles empty lists and unknown active tabs", () => {
  assert.equal(getAdjacentTabId([], "a", 1), null);
  assert.equal(getAdjacentTabId(["a", "b"], "missing", -1), null);
});
