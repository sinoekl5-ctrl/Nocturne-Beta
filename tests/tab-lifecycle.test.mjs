import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateTabSleep,
  markTabSleeping,
  wakeTab,
  sweepUntouchedTabs,
  restoreRecentlyCleanedEntry,
} from "../browser-core/tab-lifecycle.mjs";

const now = 1_000_000;
const threshold = 30 * 60 * 1000;
const idleTab = {
  id: "idle",
  title: "Old research",
  url: "research.local",
  active: false,
  pinned: false,
  keepLoaded: false,
  audible: false,
  playingMedia: false,
  beforeUnload: false,
  sleeping: false,
  lastActiveAt: now - threshold - 1,
};

test("sleep policy accepts an inactive unprotected tab past the supplied threshold", () => {
  const result = evaluateTabSleep(idleTab, { now, idleThresholdMs: threshold });
  assert.equal(result.eligible, true);
  assert.equal(result.reason, "idle");
});

test("active, pinned, kept-loaded, audible, media and beforeunload tabs are protected", () => {
  for (const [field, expected] of [
    ["active", "active"],
    ["pinned", "pinned"],
    ["keepLoaded", "keep-loaded"],
    ["audible", "audible"],
    ["playingMedia", "playing-media"],
    ["beforeUnload", "before-unload"],
  ]) {
    const result = evaluateTabSleep({ ...idleTab, [field]: true }, { now, idleThresholdMs: threshold });
    assert.equal(result.eligible, false, field);
    assert.equal(result.reason, expected, field);
  }
});

test("recent, unknown-timestamp and clock-skew tabs are not slept", () => {
  assert.equal(evaluateTabSleep({ ...idleTab, lastActiveAt: now - 100 }, { now, idleThresholdMs: threshold }).reason, "recently-active");
  assert.equal(evaluateTabSleep({ ...idleTab, lastActiveAt: null }, { now, idleThresholdMs: threshold }).reason, "missing-activity-time");
  assert.equal(evaluateTabSleep({ ...idleTab, lastActiveAt: now + 1 }, { now, idleThresholdMs: threshold }).reason, "clock-skew");
});

test("marking and waking a tab are immutable state transitions", () => {
  const sleeping = markTabSleeping(idleTab, { now, idleThresholdMs: threshold });
  assert.equal(sleeping.changed, true);
  assert.equal(sleeping.tab.sleeping, true);
  assert.equal(idleTab.sleeping, false);
  assert.equal(wakeTab(sleeping.tab).sleeping, false);
  assert.equal(markTabSleeping({ ...idleTab, active: true }, { now, idleThresholdMs: threshold }).changed, false);
});

test("Recently Cleaned archives the oldest untouched eligible tabs and keeps one open", () => {
  const tabs = [
    { ...idleTab, id: "oldest", lastActiveAt: now - threshold * 4 },
    { ...idleTab, id: "older", lastActiveAt: now - threshold * 3 },
    { ...idleTab, id: "active", active: true },
    { ...idleTab, id: "pinned", pinned: true },
    { ...idleTab, id: "fresh", lastActiveAt: now - 500 },
  ];
  const result = sweepUntouchedTabs(tabs, { now, untouchedThresholdMs: threshold });
  assert.deepEqual(result.archiveEntries.map((entry) => entry.tab.id), ["oldest"]);
  assert.equal(result.remainingTabs.length, 4);
  assert.equal(result.remainingTabs.some((tab) => tab.active), true);
  assert.equal(result.remainingTabs.some((tab) => tab.pinned), true);
});

test("Recently Cleaned archive entries can be restored", () => {
  const result = sweepUntouchedTabs([idleTab, { ...idleTab, id: "keep", active: true }], {
    now,
    untouchedThresholdMs: threshold,
  });
  assert.equal(result.archiveEntries.length, 1);
  const restored = restoreRecentlyCleanedEntry(result.archiveEntries[0]);
  assert.equal(restored.id, "idle");
  assert.equal(restored.sleeping, false);
  assert.equal(restored.active, false);
  assert.throws(() => restoreRecentlyCleanedEntry({ reason: "other", tab: idleTab }), /Invalid Recently Cleaned/);
});

test("sleep and sweep thresholds require positive finite values", () => {
  assert.throws(() => evaluateTabSleep(idleTab, { now, idleThresholdMs: 0 }), /positive finite/);
  assert.throws(() => sweepUntouchedTabs([idleTab], { now, untouchedThresholdMs: -1 }), /positive finite/);
});
