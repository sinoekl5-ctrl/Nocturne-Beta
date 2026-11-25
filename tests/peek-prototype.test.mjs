import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../prototype/index.html", import.meta.url), "utf8");
const app = readFileSync(new URL("../prototype/app.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../prototype/styles.css", import.meta.url), "utf8");

test("Peek is reachable from the page toolbar and uses a labelled native dialog", () => {
  assert.match(html, /id="peekButton"[^>]*aria-haspopup="dialog"/);
  assert.match(html, /<dialog class="peek-dialog" id="peekDialog" aria-labelledby="peekTitle">/);
  assert.match(html, /id="peekTitle"/);
});

test("Peek exposes current-tab and new-tab local preview actions", () => {
  assert.match(app, /function openPeek\(\)/);
  assert.match(app, /function openPeekInCurrentTab\(\)/);
  assert.match(app, /function openPeekInNewTab\(\)/);
  assert.match(app, /setPreviewPage\("Atlas of small ideas", "atlas\.preview"/);
  assert.match(app, /#peekOpenCurrent.*openPeekInCurrentTab/s);
  assert.match(app, /#peekOpenNew.*openPeekInNewTab/s);
});

test("Peek preview is styled and clearly marked as local rather than live navigation", () => {
  assert.match(html, /LOCAL LINK PREVIEW/);
  assert.match(html, /Chromium link metadata is not connected/);
  assert.match(css, /\.peek-dialog/);
  assert.match(app, /local preview, not a live website/i);
});
