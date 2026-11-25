import test from "node:test";
import assert from "node:assert/strict";
import {
  NOCTURNE_WEBUI_ORIGIN,
  isTrustedBridgeContext,
  validateBridgeRequest,
} from "../spikes/chromium-webui/bridge-contract.mjs";

const trustedContext = {
  origin: NOCTURNE_WEBUI_ORIGIN,
  isWebUI: true,
  isPrimaryMainFrame: true,
};

test("bridge context requires Nocturne WebUI and the primary main frame", () => {
  assert.equal(isTrustedBridgeContext(trustedContext), true);
  assert.equal(isTrustedBridgeContext({ ...trustedContext, origin: "https://example.com" }), false);
  assert.equal(isTrustedBridgeContext({ ...trustedContext, isPrimaryMainFrame: false }), false);
  assert.equal(isTrustedBridgeContext({ ...trustedContext, isWebUI: false }), false);
  assert.equal(isTrustedBridgeContext(null), false);
});

test("getVersion accepts only an empty payload and a bounded request ID", () => {
  assert.deepEqual(validateBridgeRequest({ requestId: "req_01", action: "getVersion", payload: {} }), {
    ok: true,
    request: { requestId: "req_01", action: "getVersion", payload: {} },
  });
  assert.equal(validateBridgeRequest({ requestId: "", action: "getVersion", payload: {} }).ok, false);
  assert.equal(validateBridgeRequest({ requestId: "req", action: "getVersion", payload: { path: "/etc/passwd" } }).ok, false);
});

test("openUrl permits ordinary HTTP(S) URLs only and rejects embedded credentials", () => {
  const accepted = validateBridgeRequest({
    requestId: "open_1",
    action: "openUrl",
    payload: { url: "https://example.com/path" },
  });
  assert.equal(accepted.ok, true);
  assert.equal(accepted.request.payload.url, "https://example.com/path");

  for (const url of [
    "javascript:alert(1)",
    "data:text/html,hello",
    "file:///etc/passwd",
    "chrome://settings",
    "https://user:secret@example.com/",
    "not a URL",
  ]) {
    assert.equal(validateBridgeRequest({ requestId: "open_2", action: "openUrl", payload: { url } }).ok, false, url);
  }
});

test("setSpaceMood accepts only the five named Nocturne moods", () => {
  assert.equal(validateBridgeRequest({ requestId: "mood_1", action: "setSpaceMood", payload: { mood: "vigil" } }).ok, true);
  assert.equal(validateBridgeRequest({ requestId: "mood_2", action: "setSpaceMood", payload: { mood: "unknown" } }).ok, false);
  assert.equal(validateBridgeRequest({ requestId: "mood_3", action: "setSpaceMood", payload: { mood: "atelier", extra: true } }).ok, false);
});

test("unknown actions, extra top-level fields and non-object requests are rejected", () => {
  assert.equal(validateBridgeRequest({ requestId: "x", action: "runShell", payload: {} }).ok, false);
  assert.equal(validateBridgeRequest({ requestId: "x", action: "getVersion", payload: {}, extra: true }).ok, false);
  assert.equal(validateBridgeRequest([]).ok, false);
});
