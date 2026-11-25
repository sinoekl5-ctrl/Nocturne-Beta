import test from "node:test";
import assert from "node:assert/strict";
import { getSpaceShortcutMood } from "../prototype/core.mjs";

const key = (value, extra = {}) => ({ key: value, ...extra });

test("1–5 select the corresponding Space mood", () => {
  assert.deepEqual(["1", "2", "3", "4", "5"].map((value) => getSpaceShortcutMood(key(value))),
    ["atelier", "gambit", "vigil", "drift", "ember"]);
});

test("other keys and modified shortcuts are ignored", () => {
  for (const event of [key("0"), key("6"), key("a"), key("1", { ctrlKey: true }),
    key("2", { metaKey: true }), key("3", { altKey: true }), key("4", { shiftKey: true })]) {
    assert.equal(getSpaceShortcutMood(event), null);
  }
});

test("shortcut does not steal input from editable targets", () => {
  assert.equal(getSpaceShortcutMood(key("2"), { editableTarget: true }), null);
});

test("shortcut is disabled while a dialog is open", () => {
  assert.equal(getSpaceShortcutMood(key("3"), { dialogOpen: true }), null);
});

test("missing or malformed keyboard event is safely ignored", () => {
  assert.equal(getSpaceShortcutMood(null), null);
  assert.equal(getSpaceShortcutMood({}), null);
});
