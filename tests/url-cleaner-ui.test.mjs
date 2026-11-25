import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [html, app, css] = await Promise.all([
  readFile(new URL("../prototype/index.html", import.meta.url), "utf8"),
  readFile(new URL("../prototype/app.js", import.meta.url), "utf8"),
  readFile(new URL("../prototype/styles.css", import.meta.url), "utf8")
]);

test("prototype exposes an accessible three-mode cleaner preference", () => {
  assert.match(html, /<label class="sr-only" for="urlCleanerMode">/);
  assert.match(html, /<select class="setting-select" id="urlCleanerMode" aria-describedby="urlCleanerDescription">/);
  for (const mode of ["disable", "suggest", "auto"]) {
    assert.match(html, new RegExp('<option value="' + mode + '"(?: selected)?>'));
  }
  assert.match(app, /\$\("#urlCleanerMode"\)\.addEventListener\("change"/);
});

test("cleaner preferences follow the active Space and survive a prototype reload locally", () => {
  assert.match(app, /CLEANER_STORAGE_KEY = "nocturne\.urlCleaner\.preferences\.v1"/);
  assert.match(app, /createUrlCleanerPreferences\(saved \? JSON\.parse\(saved\) : \{\}\)/);
  assert.match(app, /setUrlCleanerMode\(cleanerPreferences, state\.mood, mode\)/);
  assert.match(app, /getUrlCleanerMode\(cleanerPreferences, state\.mood\)/);
  assert.match(app, /syncCleanerModeControl\(\);/);
});

test("Suggest presents an explicit choice; Auto and Disable keep their distinct contracts", () => {
  assert.match(app, /if \(cleaner\.shouldSuggest\)/);
  assert.match(app, /showCleanerSuggestion\(cleaner\.candidateUrl, cleaner\.removedParams\)/);
  assert.match(app, /cleaner\.mode === "auto" && cleaner\.changed/);
  assert.match(app, /\$\("#openCleanedPreview"\)\.addEventListener/);
  assert.match(app, /\$\("#keepOriginalAddress"\)\.addEventListener/);
  assert.match(app, /hideCleanerSuggestion\(\);/);
});

test("the suggestion is labeled as preview-only and receives responsive styling", () => {
  assert.match(html, /id="urlCleanerNotice"[^>]*role="status"/);
  assert.match(app, /Chromium navigation is not connected/);
  assert.match(app, /No external website was opened/);
  assert.match(css, /\.url-cleaner-notice/);
  assert.match(css, /@media \(max-width: 640px\)[\s\S]*\.url-cleaner-notice/);
});
