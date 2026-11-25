import test from "node:test";
import assert from "node:assert/strict";
import { cleanLink, isTrackingParameter } from "../browser-core/url-cleaner.mjs";

test("Disable mode leaves every input untouched and does not parse it", () => {
  const input = "javascript:alert(1)?utm_source=mail";
  assert.deepEqual(cleanLink(input, { mode: "disable" }), {
    mode: "disable", action: "disabled", url: input, originalUrl: input,
    cleanedUrl: input, removedParameters: [],
  });
});

test("Suggest mode returns a candidate without changing the navigation URL", () => {
  const input = "https://example.com/article?utm_source=newsletter&id=42";
  const result = cleanLink(input, { mode: "suggest" });
  assert.equal(result.action, "suggested");
  assert.equal(result.url, input);
  assert.equal(result.cleanedUrl, "https://example.com/article?id=42");
  assert.deepEqual(result.removedParameters, ["utm_source"]);
});

test("Auto-clean removes known trackers and preserves useful parameters", () => {
  const input = "https://shop.example/product?id=123&color=blue&gclid=click-id&variant=large";
  const result = cleanLink(input, { mode: "auto-clean" });
  assert.equal(result.action, "cleaned");
  assert.equal(result.url, "https://shop.example/product?id=123&color=blue&variant=large");
  assert.deepEqual(result.removedParameters, ["gclid"]);
});

test("UTM names are case-insensitive and encoded names are decoded", () => {
  const input = "https://example.com/?UTM_Source=x&%75tm_campaign=spring&keep=1";
  const result = cleanLink(input, { mode: "auto-clean" });
  assert.equal(result.url, "https://example.com/?keep=1");
  assert.deepEqual(result.removedParameters, ["UTM_Source", "utm_campaign"]);
  assert.equal(isTrackingParameter("Utm_Medium"), true);
});

test("Duplicate tracker parameters are all removed but reported once", () => {
  const input = "https://example.com/?fbclid=a&fbclid=b&x=1";
  const result = cleanLink(input, { mode: "auto-clean" });
  assert.equal(result.url, "https://example.com/?x=1");
  assert.deepEqual(result.removedParameters, ["fbclid"]);
});

test("Non-tracking query pairs retain their order and raw encoding", () => {
  const input = "https://example.com/p?name=Jane%20Doe&tag=a+b&utm_source=mail&next=%2Fdocs#section-2";
  const result = cleanLink(input, { mode: "auto-clean" });
  assert.equal(result.url, "https://example.com/p?name=Jane%20Doe&tag=a+b&next=%2Fdocs#section-2");
});

test("Tracking-only query strings are removed without losing the fragment", () => {
  const input = "https://example.com/page?utm_source=mail#details";
  assert.equal(cleanLink(input, { mode: "auto-clean" }).url, "https://example.com/page#details");
});

test("Unknown business parameters are not guessed to be tracking", () => {
  const input = "https://example.com/?ref=partner&source=integration&id=abc";
  const result = cleanLink(input, { mode: "auto-clean" });
  assert.equal(result.action, "unchanged");
  assert.equal(result.url, input);
  assert.deepEqual(result.removedParameters, []);
});

test("URLs without tracking parameters remain byte-for-byte unchanged", () => {
  const input = "https://example.com/a%2Fb?q=two+words&empty=#hash";
  const result = cleanLink(input, { mode: "suggest" });
  assert.equal(result.action, "unchanged");
  assert.equal(result.cleanedUrl, input);
  assert.equal(result.url, input);
});

test("Malformed, unsupported-scheme, credential-bearing and oversized URLs are rejected", () => {
  for (const input of [
    "not a url", "javascript:alert(1)", "data:text/html,hello", "file:///etc/passwd",
    "chrome://settings/?utm_source=x", "https://user:secret@example.com/?utm_source=x",
    `https://example.com/?q=${"x".repeat(8200)}`,
  ]) {
    assert.equal(cleanLink(input, { mode: "auto-clean" }).action, "invalid", input.slice(0, 80));
  }
});

test("Unknown modes and non-string inputs fail closed", () => {
  assert.equal(cleanLink("https://example.com", { mode: "automatic" }).reason, "unsupported-mode");
  assert.equal(cleanLink(null, { mode: "auto-clean" }).action, "invalid");
  assert.equal(cleanLink(" https://example.com ", { mode: "auto-clean" }).action, "invalid");
});
