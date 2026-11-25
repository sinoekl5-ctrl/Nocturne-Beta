/**
 * Reference contract for the future privileged chrome://nocturne bridge.
 *
 * This module is a test oracle for protocol shape only. It is NOT a security
 * boundary and must never replace validation in Chromium's native WebUI host.
 */

export const TRUSTED_WEBUI_ORIGIN = "chrome://nocturne";
export const WEBUI_BRIDGE_PROTOCOL_VERSION = 1;
export const MAX_WEBUI_BRIDGE_MESSAGE_BYTES = 8_192;

const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const SPACE_ID_PATTERN = /^[a-z][a-z0-9-]{0,31}$/;
const TAB_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

function isPlainRecord(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasExactlyKeys(value, expectedKeys) {
  if (!isPlainRecord(value)) return false;

  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();

  return actual.length === expected.length &&
    actual.every((key, index) => key === expected[index]);
}

function reject(reason) {
  return Object.freeze({ ok: false, reason });
}

function validatePayload(action, payload) {
  switch (action) {
    case "shell.getState":
      return hasExactlyKeys(payload, []) ? null : "invalid-payload";

    case "spaces.activate":
      return hasExactlyKeys(payload, ["spaceId"]) &&
        typeof payload.spaceId === "string" &&
        SPACE_ID_PATTERN.test(payload.spaceId)
        ? null
        : "invalid-payload";

    case "tabs.activate":
      return hasExactlyKeys(payload, ["tabId"]) &&
        typeof payload.tabId === "string" &&
        TAB_ID_PATTERN.test(payload.tabId)
        ? null
        : "invalid-payload";

    default:
      return "unknown-action";
  }
}

/**
 * Validate a proposed request against the protocol and a host-derived frame
 * context. The native Chromium host must derive frameContext itself from the
 * committed RenderFrameHost/WebContents; never accept it from renderer input.
 */
export function validateWebUiBridgeRequest(request, frameContext) {
  if (!isPlainRecord(frameContext)) return reject("invalid-frame-context");
  if (frameContext.isCommitted !== true) return reject("uncommitted-document");
  if (frameContext.isWebUi !== true) return reject("not-webui");
  if (frameContext.isPrimaryMainFrame !== true) return reject("not-primary-main-frame");
  if (frameContext.origin !== TRUSTED_WEBUI_ORIGIN) return reject("untrusted-origin");

  if (!isPlainRecord(request)) return reject("invalid-message");

  let serialized;
  try {
    serialized = JSON.stringify(request);
  } catch {
    return reject("invalid-message");
  }

  if (typeof serialized !== "string") return reject("invalid-message");
  if (new TextEncoder().encode(serialized).byteLength > MAX_WEBUI_BRIDGE_MESSAGE_BYTES) {
    return reject("message-too-large");
  }

  if (!hasExactlyKeys(request, ["version", "requestId", "action", "payload"])) {
    return reject("invalid-message");
  }
  if (request.version !== WEBUI_BRIDGE_PROTOCOL_VERSION) {
    return reject("unsupported-version");
  }
  if (typeof request.requestId !== "string" || !REQUEST_ID_PATTERN.test(request.requestId)) {
    return reject("invalid-request-id");
  }
  if (typeof request.action !== "string") return reject("unknown-action");

  const payloadError = validatePayload(request.action, request.payload);
  if (payloadError) return reject(payloadError);

  return Object.freeze({
    ok: true,
    requestId: request.requestId,
    action: request.action,
    payload: Object.freeze({ ...request.payload })
  });
}
