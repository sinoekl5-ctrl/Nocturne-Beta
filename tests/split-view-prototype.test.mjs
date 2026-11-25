import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const html = readFileSync(new URL("../prototype/index.html", import.meta.url), "utf8");
const app = readFileSync(new URL("../prototype/app.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../prototype/styles.css", import.meta.url), "utf8");
test("Split View provides focus controls and local sample switching", () => {
  assert.match(html, /id="focusFirstPane"/);
  assert.match(html, /id="focusSecondPane"/);
  assert.match(html, /id="nextSecondPane"/);
  assert.match(app, /function focusPane/);
  assert.match(app, /function renderSecondPanePage/);
  assert.match(app, /renderSecondPanePage\(state\.secondPanePage \+ 1\)/);
});
test("Split View updates focus state and clearly marks local-only samples", () => {
  assert.match(app, /dataset\.activePane/);
  assert.match(app, /First preview pane focused/);
  assert.match(app, /Second preview pane focused/);
  assert.match(html, /no separate Chromium tab or network page is attached/);
  assert.match(css, /\.pane-focused/);
});
test("Closing Split View resets focus to the primary pane", () => {
  assert.match(app, /state\.activePane = 1/);
  assert.match(app, /dataset\.activePane = "1"/);
  assert.match(app, /focusFirstPane.*setAttribute\("aria-pressed", "true"\)/);
  assert.match(app, /focusSecondPane.*setAttribute\("aria-pressed", "false"\)/);
});
test("Second pane focus has a single event handler", () => {
  assert.equal((app.match(/\$\("#focusSecondPane"\)\.addEventListener\("click"/g) ?? []).length, 1);
});

test("Split View uses a real accessible divider inside a two-pane grid", () => {
  assert.match(html, /role="separator"/);
  assert.match(html, /aria-orientation="vertical"/);
  assert.match(html, /aria-valuemin="25"/);
  assert.match(html, /aria-valuemax="75"/);
  assert.match(html, /id="splitDivider"[^>]*tabindex="0"/);
  assert.match(app, /function setSplitRatio/);
  assert.match(app, /--split-first-pane/);
  assert.match(css, /grid-template-columns: minmax\(0, var\(--split-first-pane/);
  assert.match(css, /cursor: col-resize/);
  assert.match(css, /\.second-pane \{ position: relative/);
});
test("Split View supports pointer dragging and keyboard resizing", () => {
  assert.match(app, /setPointerCapture/);
  assert.match(app, /pointermove/);
  assert.match(app, /ArrowLeft/);
  assert.match(app, /ArrowRight/);
  assert.match(app, /event\.key === "Home"/);
  assert.match(app, /event\.key === "End"/);
  assert.match(app, /aria-valuetext/);
});

test("Split View ratio clamps finite edge values and safely handles invalid input", () => {
  assert.match(app, /Number\.isFinite\(numericValue\)/);
  assert.match(app, /Math\.max\(25, Math\.min\(75,/);
  assert.doesNotMatch(app, /Number\(value\) \|\| 50/);
});
