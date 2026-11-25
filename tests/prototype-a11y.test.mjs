import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../prototype/index.html", import.meta.url), "utf8");
const app = await readFile(new URL("../prototype/app.js", import.meta.url), "utf8");
const css = await readFile(new URL("../prototype/styles.css", import.meta.url), "utf8");

test("prototype settings shortcut has an explicit accessible name that follows the selected language", () => {
  assert.match(html, /id="settingsQuick"[^>]*aria-label="Preferences"/);
  assert.match(app, /\$\("#settingsQuick"\)\.setAttribute\("aria-label", labels\.preferences\)/);
});

test("prototype dialogs have accessible title relationships", () => {
  assert.match(html, /<dialog[^>]*id="commandDialog"[^>]*aria-labelledby="commandTitle"/);
  assert.match(html, /<dialog[^>]*id="settingsDialog"[^>]*aria-labelledby="settingsTitle"/);
});

test("prototype exposes keyboard focus and reduced-motion styling", () => {
  assert.match(css, /:focus-visible\s*\{[^}]*outline/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

test("Arabic language preview updates document language and direction", () => {
  assert.match(app, /root\.lang = state\.language/);
  assert.match(app, /root\.dir = state\.rtl \? "rtl" : "ltr"/);
  assert.match(app, /setRTL\(arabic, false\)/);
});

test("all preference switches are programmatically named by their visible labels", () => {
  const switches = [
    ["daySetting", "dayLabel"],
    ["contrastSetting", "contrastLabel"],
    ["motionSetting", "motionLabel"],
    ["languageSetting", "languageLabel"],
    ["rtlSetting", "mirrorLabel"],
    ["textureSetting", "textureLabel"],
  ];
  for (const [control, label] of switches) {
    const pattern = new RegExp(`<button[^>]*id="${control}"[^>]*aria-labelledby="${label}"`);
    assert.match(html, pattern, `${control} should reference its visible label`);
  }
});
