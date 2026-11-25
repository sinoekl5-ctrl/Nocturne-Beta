/**
 * Typed frontend request adapter for the future chrome://nocturne host.
 *
 * This only constructs and sends protocol-v1 requests. It does not establish
 * renderer trust or replace native Chromium validation/authorization.
 */
import {
  TRUSTED_WEBUI_ORIGIN,
  WEBUI_BRIDGE_PROTOCOL_VERSION,
  validateWebUiBridgeRequest
} from "./webui-bridge-contract.mjs";

const CLIENT_FRAME_SHAPE = Object.freeze({
  origin: TRUSTED_WEBUI_ORIGIN,
  isCommitted: true,
  isWebUi: true,
  isPrimaryMainFrame: true
});

function defaultRequestIdFactory() {
  if (typeof globalThis.crypto?.randomUUID !== "function") {
    throw new Error("A secure request ID generator is required");
  }
  return globalThis.crypto.randomUUID();
}

/**
 * @param {{send: (request: object) => unknown, requestIdFactory?: () => string}} options
 */
export function createWebUiBridgeClient({ send, requestIdFactory = defaultRequestIdFactory } = {}) {
  if (typeof send !== "function") {
    throw new TypeError("send must be a function");
  }
  if (typeof requestIdFactory !== "function") {
    throw new TypeError("requestIdFactory must be a function");
  }

  function dispatch(action, payload) {
    const request = {
      version: WEBUI_BRIDGE_PROTOCOL_VERSION,
      requestId: requestIdFactory(),
      action,
      payload
    };
    const validation = validateWebUiBridgeRequest(request, CLIENT_FRAME_SHAPE);
    if (!validation.ok) {
      throw new TypeError(`Invalid bridge request: ${validation.reason}`);
    }
    send(validation);
    return validation;
  }

  return Object.freeze({
    getState() {
      return dispatch("shell.getState", {});
    },
    activateSpace(spaceId) {
      return dispatch("spaces.activate", { spaceId });
    },
    activateTab(tabId) {
      return dispatch("tabs.activate", { tabId });
    }
  });
}
