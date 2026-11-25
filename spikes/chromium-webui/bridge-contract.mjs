/**
 * Nocturne's pre-integration WebUI bridge contract.
 *
 * This module validates a deliberately tiny, JSON-shaped message surface. It is
 * NOT a Chromium security boundary: production callers must derive origin and
 * frame identity from Chromium's RenderFrameHost/WebContents objects in the
 * browser process, then apply this contract before dispatching any action.
 */

export const NOCTURNE_WEBUI_ORIGIN = "chrome://nocturne";
export const SPACE_MOODS = Object.freeze(["atelier", "gambit", "vigil", "drift", "ember"]);

const REQUEST_ID = /^[A-Za-z0-9_-]{1,64}$/;
const HTTP_PROTOCOLS = new Set(["http:", "https:"]);
const ACTIONS = new Set(["getVersion", "openUrl", "setSpaceMood"]);

function isPlainRecord(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasExactKeys(value, expected) {
  return isPlainRecord(value)
    && Object.keys(value).length === expected.length
    && expected.every((key) => Object.hasOwn(value, key));
}

/**
 * The browser process must construct this context from Chromium-owned state.
 * Never accept origin/frame claims supplied by renderer JavaScript or a page.
 */
export function isTrustedBridgeContext(context) {
  if (!isPlainRecord(context)) return false;
  return context.origin === NOCTURNE_WEBUI_ORIGIN
    && context.isWebUI === true
    && context.isPrimaryMainFrame === true;
}

function validatePayload(action, payload) {
  if (!isPlainRecord(payload)) return { ok: false, reason: "payload_must_be_object" };

  if (action === "getVersion") {
    return Object.keys(payload).length === 0
      ? { ok: true, payload: {} }
      : { ok: false, reason: "unexpected_payload_fields" };
  }

  if (action === "openUrl") {
    if (!hasExactKeys(payload, ["url"]) || typeof payload.url !== "string" || payload.url.length > 4096) {
      return { ok: false, reason: "invalid_open_url_payload" };
    }
    let url;
    try {
      url = new URL(payload.url);
    } catch {
      return { ok: false, reason: "invalid_url" };
    }
    if (!HTTP_PROTOCOLS.has(url.protocol) || !url.hostname || url.username || url.password) {
      return { ok: false, reason: "url_scheme_or_credentials_not_allowed" };
    }
    return { ok: true, payload: { url: url.href } };
  }

  if (action === "setSpaceMood") {
    if (!hasExactKeys(payload, ["mood"]) || !SPACE_MOODS.includes(payload.mood)) {
      return { ok: false, reason: "invalid_space_mood" };
    }
    return { ok: true, payload: { mood: payload.mood } };
  }

  return { ok: false, reason: "unknown_action" };
}

/** Validate and normalize a bridge request without performing any side effect. */
export function validateBridgeRequest(request) {
  if (!hasExactKeys(request, ["requestId", "action", "payload"])) {
    return { ok: false, reason: "invalid_request_shape" };
  }
  if (typeof request.requestId !== "string" || !REQUEST_ID.test(request.requestId)) {
    return { ok: false, reason: "invalid_request_id" };
  }
  if (typeof request.action !== "string" || !ACTIONS.has(request.action)) {
    return { ok: false, reason: "unknown_action" };
  }

  const validated = validatePayload(request.action, request.payload);
  if (!validated.ok) return validated;
  return {
    ok: true,
    request: {
      requestId: request.requestId,
      action: request.action,
      payload: validated.payload,
    },
  };
}
