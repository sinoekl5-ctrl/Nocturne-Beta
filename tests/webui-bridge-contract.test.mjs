import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_WEBUI_BRIDGE_MESSAGE_BYTES,
  TRUSTED_WEBUI_ORIGIN,
  WEBUI_BRIDGE_PROTOCOL_VERSION,
  validateWebUiBridgeRequest
} from "../packages/core/webui-bridge-contract.mjs";

const trustedFrame = Object.freeze({
  origin: TRUSTED_WEBUI_ORIGIN,
  isCommitted: true,
  isWebUi: true,
  isPrimaryMainFrame: true
});

function request(action, payload = {}) {
  return {
    version: WEBUI_BRIDGE_PROTOCOL_VERSION,
    requestId: "req_01",
    action,
    payload
  };
}

test("accepts the minimal read-only shell state request", () => {
  const result = validateWebUiBridgeRequest(request("shell.getState"), trustedFrame);
  assert.deepEqual(result, {
    ok: true,
    requestId: "req_01",
    action: "shell.getState",
    payload: {}
  });
});

test("accepts a Space activation request with a bounded identifier", () => {
  const result = validateWebUiBridgeRequest(
    request("spaces.activate", { spaceId: "atelier-work" }),
    trustedFrame
  );

  assert.equal(result.ok, true);
  assert.equal(result.action, "spaces.activate");
  assert.equal(result.payload.spaceId, "atelier-work");
});

test("accepts a browser-owned tab activation request with an opaque handle", () => {
  const result = validateWebUiBridgeRequest(
    request("tabs.activate", { tabId: "tab_7d2a" }),
    trustedFrame
  );

  assert.equal(result.ok, true);
  assert.equal(result.action, "tabs.activate");
  assert.equal(result.payload.tabId, "tab_7d2a");
});

test("rejects ordinary website origins", () => {
  const frame = { ...trustedFrame, origin: "https://example.com" };
  assert.equal(validateWebUiBridgeRequest(request("shell.getState"), frame).reason, "untrusted-origin");
});

test("rejects a different chrome host", () => {
  const frame = { ...trustedFrame, origin: "chrome://settings" };
  assert.equal(validateWebUiBridgeRequest(request("shell.getState"), frame).reason, "untrusted-origin");
});

test("rejects an uncommitted document", () => {
  const frame = { ...trustedFrame, isCommitted: false };
  assert.equal(validateWebUiBridgeRequest(request("shell.getState"), frame).reason, "uncommitted-document");
});

test("rejects non-WebUI documents even if an origin string matches", () => {
  const frame = { ...trustedFrame, isWebUi: false };
  assert.equal(validateWebUiBridgeRequest(request("shell.getState"), frame).reason, "not-webui");
});

test("rejects subframes even when they share the trusted origin", () => {
  const frame = { ...trustedFrame, isPrimaryMainFrame: false };
  assert.equal(validateWebUiBridgeRequest(request("shell.getState"), frame).reason, "not-primary-main-frame");
});

test("rejects missing or malformed host frame context", () => {
  assert.equal(validateWebUiBridgeRequest(request("shell.getState"), null).reason, "invalid-frame-context");
  assert.equal(validateWebUiBridgeRequest(request("shell.getState"), {}).reason, "uncommitted-document");
});

test("rejects non-object, array, and envelope-with-extra-field messages", () => {
  assert.equal(validateWebUiBridgeRequest(null, trustedFrame).reason, "invalid-message");
  assert.equal(validateWebUiBridgeRequest([], trustedFrame).reason, "invalid-message");
  assert.equal(
    validateWebUiBridgeRequest({ ...request("shell.getState"), origin: TRUSTED_WEBUI_ORIGIN }, trustedFrame).reason,
    "invalid-message"
  );
});

test("rejects unsupported protocol versions", () => {
  const message = { ...request("shell.getState"), version: 2 };
  assert.equal(validateWebUiBridgeRequest(message, trustedFrame).reason, "unsupported-version");
});

test("rejects malformed request identifiers", () => {
  for (const requestId of ["", "contains spaces", "x".repeat(65), "unsafe/segment"]) {
    const message = { ...request("shell.getState"), requestId };
    assert.equal(validateWebUiBridgeRequest(message, trustedFrame).reason, "invalid-request-id");
  }
});

test("rejects unknown actions instead of attempting dynamic dispatch", () => {
  assert.equal(
    validateWebUiBridgeRequest(request("tabs.executeJavaScript"), trustedFrame).reason,
    "unknown-action"
  );
});

test("rejects payloads with missing, mistyped, or additional properties", () => {
  const invalid = [
    request("spaces.activate"),
    request("spaces.activate", { spaceId: 42 }),
    request("spaces.activate", { spaceId: "../profile" }),
    request("spaces.activate", { spaceId: "Atelier" }),
    request("spaces.activate", { spaceId: "atelier", profilePath: "/tmp/profile" }),
    request("tabs.activate", { tabId: 12 }),
    request("tabs.activate", { tabId: "tab 1" }),
    request("tabs.activate", { tabId: "tab_1", url: "https://example.com" }),
    request("shell.getState", { includeCookies: true })
  ];

  for (const message of invalid) {
    assert.equal(validateWebUiBridgeRequest(message, trustedFrame).reason, "invalid-payload");
  }
});

test("rejects unknown or missing payload data for every action", () => {
  assert.equal(
    validateWebUiBridgeRequest({ ...request("shell.getState") }, trustedFrame).ok,
    true
  );
  assert.equal(
    validateWebUiBridgeRequest({ ...request("shell.getState"), payload: null }, trustedFrame).reason,
    "invalid-payload"
  );
  assert.equal(
    validateWebUiBridgeRequest({ ...request("tabs.activate", { tabId: "t1" }), payload: undefined }, trustedFrame).reason,
    "invalid-payload"
  );
});

test("enforces the UTF-8 message budget before action dispatch", () => {
  const message = request("shell.getState", { padding: "x".repeat(MAX_WEBUI_BRIDGE_MESSAGE_BYTES) });
  assert.equal(validateWebUiBridgeRequest(message, trustedFrame).reason, "message-too-large");
});

test("counts serialized size in UTF-8 bytes rather than JavaScript characters", () => {
  const message = request("shell.getState", { padding: "é".repeat(4_096) });
  assert.equal(validateWebUiBridgeRequest(message, trustedFrame).reason, "message-too-large");
});

test("returns immutable result and payload objects", () => {
  const result = validateWebUiBridgeRequest(
    request("spaces.activate", { spaceId: "gambit" }),
    trustedFrame
  );

  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.payload), true);
});
