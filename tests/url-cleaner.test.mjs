import test from "node:test";
import assert from "node:assert/strict";
import { cleanTrackingUrl, createUrlCleanerPreferences, getUrlCleanerMode, isTrackingParameter, setUrlCleanerMode } from "../packages/core/url-cleaner.mjs";

test("auto mode removes known tracking parameters and preserves useful URL data", () => {
  const input = "https://example.com/article?utm_source=newsletter&id=42&ref=chapter#summary";
  const result = cleanTrackingUrl(input, { mode: "auto" });

  assert.equal(result.changed, true);
  assert.equal(result.candidateUrl, "https://example.com/article?id=42&ref=chapter#summary");
  assert.equal(result.navigationUrl, result.candidateUrl);
  assert.deepEqual(result.removedParams, ["utm_source"]);
  assert.equal(result.shouldSuggest, false);
});

test("suggest mode exposes a candidate without changing the navigation URL", () => {
  const input = "https://example.com/?fbclid=abc&article=welcome";
  const result = cleanTrackingUrl(input, { mode: "suggest" });

  assert.equal(result.candidateUrl, "https://example.com/?article=welcome");
  assert.equal(result.navigationUrl, input);
  assert.equal(result.shouldSuggest, true);
});

test("disable mode preserves the input byte-for-byte", () => {
  const input = "HTTPS://Example.com/path?utm_source=a&x=1#part";
  const result = cleanTrackingUrl(input, { mode: "disable" });

  assert.equal(result.candidateUrl, input);
  assert.equal(result.navigationUrl, input);
  assert.equal(result.changed, false);
  assert.equal(result.skippedReason, "disabled");
});

test("matching is case-insensitive and recognizes encoded parameter names", () => {
  const result = cleanTrackingUrl(
    "https://example.com/?UTM_Source=mail&%66%62%63%6c%69%64=abc&keep=1",
    { mode: "auto" }
  );

  assert.equal(result.candidateUrl, "https://example.com/?keep=1");
  assert.deepEqual(result.removedParams, ["UTM_Source", "fbclid"]);
});

test("all repeated tracker instances are removed, while repeated useful values remain", () => {
  const result = cleanTrackingUrl(
    "https://example.com/?tag=a&utm_source=one&tag=b&utm_source=two",
    { mode: "auto" }
  );

  assert.equal(result.candidateUrl, "https://example.com/?tag=a&tag=b");
  assert.deepEqual(result.removedParams, ["utm_source", "utm_source"]);
});

test("known signed URLs are left unchanged", () => {
  for (const signature of ["X-Amz-Signature=abc", "sig=abc", "Key-Pair-Id=key"]) {
    const input = `https://cdn.example.com/file?utm_source=mail&${signature}`;
    const result = cleanTrackingUrl(input, { mode: "auto" });
    assert.equal(result.candidateUrl, input);
    assert.equal(result.navigationUrl, input);
    assert.equal(result.skippedReason, "signed-url");
    assert.deepEqual(result.removedParams, []);
  }
});

test("non-HTTP schemes and invalid URLs are not modified", () => {
  const javascriptUrl = "javascript:alert(1)";
  const invalidUrl = "not a URL";
  assert.equal(cleanTrackingUrl(javascriptUrl, { mode: "auto" }).skippedReason, "unsupported-scheme");
  assert.equal(cleanTrackingUrl(invalidUrl, { mode: "auto" }).skippedReason, "invalid-url");
  assert.equal(cleanTrackingUrl(javascriptUrl, { mode: "auto" }).navigationUrl, javascriptUrl);
});

test("query-looking text inside a fragment is not treated as a query", () => {
  const input = "https://example.com/article#section?utm_source=mail";
  const result = cleanTrackingUrl(input, { mode: "auto" });
  assert.equal(result.changed, false);
  assert.equal(result.candidateUrl, input);
});

test("semantic and unknown parameters are preserved", () => {
  const input = "https://example.com/?ref=friend&source=feed&my_utm_source=value&campaign=spring";
  const result = cleanTrackingUrl(input, { mode: "auto" });
  assert.equal(result.changed, false);
  assert.equal(result.candidateUrl, input);
});

test("malformed percent encoding is preserved without throwing", () => {
  const input = "https://example.com/?%ZZ=keep&utm_medium=email";
  const result = cleanTrackingUrl(input, { mode: "auto" });
  assert.equal(result.candidateUrl, "https://example.com/?%ZZ=keep");
});

test("URL objects are accepted", () => {
  const result = cleanTrackingUrl(new URL("https://example.com/?gclid=abc&q=quiet"), { mode: "auto" });
  assert.equal(result.candidateUrl, "https://example.com/?q=quiet");
});

test("unknown modes safely fall back to suggest, not auto", () => {
  const input = "https://example.com/?utm_campaign=launch";
  const result = cleanTrackingUrl(input, { mode: "always" });
  assert.equal(result.mode, "suggest");
  assert.equal(result.navigationUrl, input);
  assert.equal(result.shouldSuggest, true);
});

test("tracking classification is deliberately narrow", () => {
  assert.equal(isTrackingParameter("utm_term"), true);
  assert.equal(isTrackingParameter("FBCLID"), true);
  assert.equal(isTrackingParameter("ref"), false);
  assert.equal(isTrackingParameter("source"), false);
  assert.equal(isTrackingParameter("my_utm_source"), false);
});

test("each Space defaults to Suggest", () => {
  const preferences = createUrlCleanerPreferences();
  assert.deepEqual(preferences, {
    atelier: "suggest", gambit: "suggest", vigil: "suggest", drift: "suggest", ember: "suggest"
  });
});

test("cleaner preferences are isolated per Space and immutable", () => {
  const original = createUrlCleanerPreferences();
  const updated = setUrlCleanerMode(original, "gambit", "auto");

  assert.notEqual(updated, original);
  assert.equal(getUrlCleanerMode(updated, "gambit"), "auto");
  assert.equal(getUrlCleanerMode(updated, "atelier"), "suggest");
  assert.equal(getUrlCleanerMode(original, "gambit"), "suggest");
});

test("unknown saved preference values are normalized to Suggest", () => {
  const preferences = createUrlCleanerPreferences({
    atelier: "always", gambit: "disable", vigil: "auto", drift: null, extra: "auto"
  });

  assert.deepEqual(preferences, {
    atelier: "suggest", gambit: "disable", vigil: "auto", drift: "suggest", ember: "suggest"
  });
  assert.equal(Object.hasOwn(preferences, "extra"), false);
});

test("unknown Space names and unknown modes cannot enable automatic cleaning", () => {
  const preferences = createUrlCleanerPreferences();
  const unknownSpace = setUrlCleanerMode(preferences, "guest", "auto");
  const invalidMode = setUrlCleanerMode(preferences, "atelier", "always");

  assert.equal(getUrlCleanerMode(unknownSpace, "guest"), "suggest");
  assert.equal(getUrlCleanerMode(unknownSpace, "atelier"), "suggest");
  assert.equal(getUrlCleanerMode(invalidMode, "atelier"), "suggest");
});
