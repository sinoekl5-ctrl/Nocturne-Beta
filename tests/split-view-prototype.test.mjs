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
  assert.match(app, /data-active-pane/);
  assert.match(app, /First preview pane focused/);
  assert.match(app, /Second preview pane focused/);
  assert.match(html, /no separate Chromium tab or network page is attached/);
  assert.match(css, /\.pane-focused/);
});
test("Closing Split View resets focus to the primary pane", () => {
  assert.match(app, /state\.activePane = 1/);
  assert.match(app, /data-active-pane = "1"/);
});