import test from "node:test";
import assert from "node:assert/strict";
import {
  createSplitView,
  addSplitPane,
  removeSplitPane,
  activateSplitPane,
  setSplitOrientation,
  reorderSplitPanes,
} from "../browser-core/split-view.mjs";

test("Split View requires two or three distinct tab IDs", () => {
  assert.deepEqual(createSplitView(["one", "two"]), {
    orientation: "vertical",
    paneIds: ["one", "two"],
    activePaneId: "one",
  });
  assert.throws(() => createSplitView(["one"]), /two or three/);
  assert.throws(() => createSplitView(["one", "one"]), /distinct tabs/);
  assert.throws(() => createSplitView(["one", "two", "three", "four"]), /two or three/);
});

test("Split View supports a third pane but rejects a fourth", () => {
  const view = createSplitView(["one", "two"]);
  const three = addSplitPane(view, "three");
  assert.equal(three.paneIds.length, 3);
  assert.throws(() => addSplitPane(three, "four"), /at most three/);
});

test("active pane and orientation changes preserve the other layout state", () => {
  const view = createSplitView(["one", "two", "three"]);
  const active = activateSplitPane(view, "two");
  assert.equal(active.activePaneId, "two");
  const horizontal = setSplitOrientation(active, "horizontal");
  assert.equal(horizontal.orientation, "horizontal");
  assert.equal(horizontal.activePaneId, "two");
  assert.throws(() => activateSplitPane(view, "missing"), /not in Split View/);
});

test("removing panes selects a valid active pane and collapses below two", () => {
  const view = activateSplitPane(createSplitView(["one", "two", "three"]), "two");
  const reduced = removeSplitPane(view, "two");
  assert.deepEqual(reduced.paneIds, ["one", "three"]);
  assert.equal(reduced.activePaneId, "one");
  assert.equal(removeSplitPane(reduced, "three"), null);
  assert.throws(() => removeSplitPane(view, "missing"), /not in Split View/);
});

test("pane reordering preserves membership and active identity", () => {
  const view = activateSplitPane(createSplitView(["one", "two", "three"]), "two");
  const reordered = reorderSplitPanes(view, ["three", "two", "one"]);
  assert.deepEqual(reordered.paneIds, ["three", "two", "one"]);
  assert.equal(reordered.activePaneId, "two");
  assert.throws(() => reorderSplitPanes(view, ["one", "two"]), /same tabs/);
});
