const MODES = new Set(["disable", "suggest", "auto"]);

const TRACKING_KEYS = new Set([
  "fbclid", "gclid", "dclid", "gbraid", "wbraid", "msclkid",
  "ttclid", "twclid", "igshid", "mc_cid", "mc_eid", "mkt_tok",
  "_hsenc", "_hsmi", "vero_id", "oly_anon_id", "oly_enc_id",
  "_openstat", "yclid", "_ga", "_gl", "srsltid", "epik",
  "s_cid", "sc_cid", "icid", "cmpid", "zanpid", "irclickid",
  "rb_clickid", "wickedid", "ref_src", "gad_source", "gad_campaignid"
]);

// Removing even an unrelated parameter can invalidate a signed URL.
const SIGNATURE_KEYS = new Set([
  "x-amz-signature", "x-goog-signature", "signature", "sig",
  "googleaccessid", "key-pair-id", "policy", "hdnea", "hdnts"
]);

function decodeParameterName(segment) {
  const equalsAt = segment.indexOf("=");
  const rawName = equalsAt === -1 ? segment : segment.slice(0, equalsAt);
  try {
    return decodeURIComponent(rawName.replace(/\+/g, " "));
  } catch {
    return null;
  }
}

function result(mode, originalUrl, candidateUrl, removedParams = [], skippedReason = null) {
  const changed = candidateUrl !== originalUrl;
  return Object.freeze({
    mode,
    originalUrl,
    candidateUrl,
    navigationUrl: mode === "auto" ? candidateUrl : originalUrl,
    changed,
    removedParams: Object.freeze([...removedParams]),
    shouldSuggest: mode === "suggest" && changed,
    skippedReason
  });
}

function hasSignatureParameter(parsedUrl) {
  for (const key of parsedUrl.searchParams.keys()) {
    if (SIGNATURE_KEYS.has(key.toLowerCase())) return true;
  }
  return false;
}

function isTrackingParameter(name) {
  const normalized = name.toLowerCase();
  return normalized.startsWith("utm_") || TRACKING_KEYS.has(normalized);
}

/**
 * Evaluate a URL-cleaning policy without performing navigation.
 *
 * - disable: preserve the supplied URL byte-for-byte.
 * - suggest: return a cleaned candidate but leave navigationUrl unchanged.
 * - auto: return the cleaned candidate as navigationUrl.
 *
 * Only HTTP(S) URLs are eligible. Known signed URLs are left untouched.
 * Unknown modes fall back to "suggest", never to automatic cleaning.
 */
export function cleanTrackingUrl(input, options = {}) {
  const originalUrl = input instanceof URL ? input.href : String(input ?? "");
  const requestedMode = String(options?.mode ?? "suggest").toLowerCase();
  const mode = MODES.has(requestedMode) ? requestedMode : "suggest";

  if (mode === "disable") return result(mode, originalUrl, originalUrl, [], "disabled");

  let parsedUrl;
  try {
    parsedUrl = new URL(originalUrl);
  } catch {
    return result(mode, originalUrl, originalUrl, [], "invalid-url");
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return result(mode, originalUrl, originalUrl, [], "unsupported-scheme");
  }

  if (hasSignatureParameter(parsedUrl)) {
    return result(mode, originalUrl, originalUrl, [], "signed-url");
  }

  const fragmentAt = originalUrl.indexOf("#");
  const beforeFragment = fragmentAt === -1 ? originalUrl : originalUrl.slice(0, fragmentAt);
  const fragment = fragmentAt === -1 ? "" : originalUrl.slice(fragmentAt);
  const queryAt = beforeFragment.indexOf("?");

  if (queryAt === -1) return result(mode, originalUrl, originalUrl);
  
  const prefix = beforeFragment.slice(0, queryAt);
  const rawQuery = beforeFragment.slice(queryAt + 1);
  const keptSegments = [];
  const removedParams = [];

  for (const segment of rawQuery.split("&")) {
    if (!segment) continue;
    const name = decodeParameterName(segment);
    if (name !== null && isTrackingParameter(name)) {
      removedParams.push(name);
    } else {
      // Preserve unrelated query segments exactly as supplied.
      keptSegments.push(segment);
    }
  }

  if (!removedParams.length) return result(mode, originalUrl, originalUrl);

  const candidateUrl = prefix +
    (keptSegments.length ? `?${keptSegments.join("&")}` : "") +
    fragment;

  return result(mode, originalUrl, candidateUrl, removedParams);
}

export { isTrackingParameter };
