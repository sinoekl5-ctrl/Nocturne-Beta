/**
 * Local query-parameter cleaner for Nocturne.
 *
 * Conservative: removes only well-known advertising/analytics identifiers.
 * It never contacts a service and does not guess about ambiguous parameters.
 */

export const CLEAN_LINK_MODES = Object.freeze(["disable", "suggest", "auto-clean"]);

const TRACKING_NAMES = new Set([
  "fbclid", "gclid", "dclid", "gbraid", "wbraid", "msclkid", "twclid",
  "ttclid", "li_fat_id", "mc_cid", "mc_eid", "igshid", "mkt_tok",
  "vero_id", "vero_conv", "oly_anon_id", "oly_enc_id", "s_cid", "wickedid",
]);

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
const MAX_URL_LENGTH = 8192;

export function isTrackingParameter(name) {
  if (typeof name !== "string") return false;
  const normalized = name.toLowerCase();
  return normalized.startsWith("utm_") || TRACKING_NAMES.has(normalized);
}

function result(mode, action, originalUrl, cleanedUrl, removedParameters = [], reason) {
  return {
    mode,
    action,
    url: action === "cleaned" ? cleanedUrl : originalUrl,
    originalUrl,
    cleanedUrl,
    removedParameters,
    ...(reason ? { reason } : {}),
  };
}

/**
 * - disable: do not inspect or change the supplied URL.
 * - suggest: report a clean candidate but keep the original navigation URL.
 * - auto-clean: return the clean candidate for the navigation caller to use.
 *
 * This function does not navigate, redirect, fetch, or mutate browser state.
 */
export function cleanLink(input, { mode = "suggest" } = {}) {
  const originalUrl = typeof input === "string" ? input : "";

  if (!CLEAN_LINK_MODES.includes(mode)) {
    return result(mode, "invalid", originalUrl, originalUrl, [], "unsupported-mode");
  }
  if (mode === "disable") {
    return result(mode, "disabled", originalUrl, originalUrl);
  }
  if (!originalUrl || originalUrl.length > MAX_URL_LENGTH || originalUrl !== originalUrl.trim()) {
    return result(mode, "invalid", originalUrl, originalUrl, [], "invalid-url-input");
  }

  let parsed;
  try {
    parsed = new URL(originalUrl);
  } catch {
    return result(mode, "invalid", originalUrl, originalUrl, [], "malformed-url");
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol) || !parsed.hostname) {
    return result(mode, "invalid", originalUrl, originalUrl, [], "unsupported-url-scheme");
  }
  if (parsed.username || parsed.password) {
    return result(mode, "invalid", originalUrl, originalUrl, [], "url-credentials-not-allowed");
  }

  // Preserve every retained query pair byte-for-byte, including order/encoding.
  const hashIndex = originalUrl.indexOf("#");
  const beforeHash = hashIndex === -1 ? originalUrl : originalUrl.slice(0, hashIndex);
  const hash = hashIndex === -1 ? "" : originalUrl.slice(hashIndex);
  const queryIndex = beforeHash.indexOf("?");
  if (queryIndex === -1) return result(mode, "unchanged", originalUrl, originalUrl);

  const rawQuery = beforeHash.slice(queryIndex + 1);
  if (!rawQuery) return result(mode, "unchanged", originalUrl, originalUrl);

  const keptPairs = [];
  const removedParameters = [];
  const seenRemoved = new Set();

  for (const pair of rawQuery.split("&")) {
    const key = new URLSearchParams(pair).keys().next().value ?? "";
    if (isTrackingParameter(key)) {
      if (!seenRemoved.has(key)) {
        seenRemoved.add(key);
        removedParameters.push(key);
      }
    } else {
      keptPairs.push(pair);
    }
  }

  if (removedParameters.length === 0) {
    return result(mode, "unchanged", originalUrl, originalUrl);
  }

  const base = beforeHash.slice(0, queryIndex);
  const remainingQuery = keptPairs.length > 0 ? `?${keptPairs.join("&")}` : "";
  const cleanedUrl = `${base}${remainingQuery}${hash}`;

  return mode === "suggest"
    ? result(mode, "suggested", originalUrl, cleanedUrl, removedParameters)
    : result(mode, "cleaned", originalUrl, cleanedUrl, removedParameters);
}
