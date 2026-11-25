import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const html = read("../prototype/index.html");
const bridge = read("../prototype/tokens-bridge.css");
const app = read("../prototype/app.js");

test("prototype loads the token source and adapter after its base stylesheet", () => {
  const base = html.indexOf('./styles.css');
  const tokens = html.indexOf('../design/tokens.css');
  const adapter = html.indexOf('./tokens-bridge.css');
  assert.ok(base >= 0 && tokens > base && adapter > tokens, "stylesheet order must be styles → tokens → adapter");
});

test("adapter maps chrome semantic roles and mood texture from design tokens", () => {
  for (const token of ["--bg", "--surface", "--surface-raised", "--text", "--text-muted", "--border", "--grain", "--glow", "--dur-std"]) {
    assert.ok(bridge.includes(`var(${token})`), `adapter should consume ${token}`);
  }
  for (const legacy of ["--window-bg", "--chrome-bg", "--chrome-raised", "--chrome-text", "--chrome-muted", "--line", "--grain-opacity", "--glow-opacity", "--dur-standard"]) {
    assert.ok(bridge.includes(`${legacy}:`), `adapter should provide ${legacy}`);
  }
});

test("prototype exposes contrast and private-space state to token selectors", () => {
  assert.ok(app.includes('root.dataset.contrast = state.highContrast ? "high" : "normal";'));
  assert.ok(app.includes('root.dataset.spaceKind = state.private ? "private" : "regular";'));
});
