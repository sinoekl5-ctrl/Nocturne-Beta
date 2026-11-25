/**
 * Browser-core policy for background-tab sleeping and Recently Cleaned.
 *
 * This module selects candidates only. It does not freeze renderer processes,
 * discard WebContents, close tabs, or persist an archive. Chromium adapters
 * must re-check each tab in the browser process immediately before acting.
 * Thresholds are supplied by the caller; no undocumented default is assumed.
 */

function requireTab(tab) {
  if (tab === null || typeof tab !== "object" || Array.isArray(tab)) {
    throw new TypeError("Tab must be an object");
  }
  if (typeof tab.id !== "string" || !tab.id.trim()) throw new TypeError("Tab id is required");
  return tab;
}

function validateTiming({ now, idleThresholdMs }) {
  if (typeof now !== "number" || !Number.isFinite(now) || now < 0) {
    throw new RangeError("now must be a finite non-negative timestamp");
  }
  if (typeof idleThresholdMs !== "number" || !Number.isFinite(idleThresholdMs) || idleThresholdMs <= 0) {
    throw new RangeError("idleThresholdMs must be a positive finite number");
  }
}

function protectedReason(tab, { ignoreSleeping = false } = {}) {
  if (tab.active === true) return "active";
  if (tab.pinned === true) return "pinned";
  if (tab.keepLoaded === true) return "keep-loaded";
  if (tab.audible === true) return "audible";
  if (tab.playingMedia === true) return "playing-media";
  if (tab.beforeUnload === true) return "before-unload";
  if (!ignoreSleeping && tab.sleeping === true) return "already-sleeping";
  return null;
}

function idleDuration(tab, now) {
  if (typeof tab.lastActiveAt !== "number" || !Number.isFinite(tab.lastActiveAt)) return null;
  if (tab.lastActiveAt > now) return -1;
  return now - tab.lastActiveAt;
}

export function evaluateTabSleep(tabInput, { now, idleThresholdMs } = {}) {
  const tab = requireTab(tabInput);
  validateTiming({ now, idleThresholdMs });
  const reason = protectedReason(tab);
  if (reason) return Object.freeze({ eligible: false, reason, idleForMs: null });

  const idleForMs = idleDuration(tab, now);
  if (idleForMs === null) return Object.freeze({ eligible: false, reason: "missing-activity-time", idleForMs: null });
  if (idleForMs < 0) return Object.freeze({ eligible: false, reason: "clock-skew", idleForMs: null });
  if (idleForMs < idleThresholdMs) return Object.freeze({ eligible: false, reason: "recently-active", idleForMs });
  return Object.freeze({ eligible: true, reason: "idle", idleForMs });
}

export function markTabSleeping(tabInput, options) {
  const tab = requireTab(tabInput);
  const evaluation = evaluateTabSleep(tab, options);
  if (!evaluation.eligible) return Object.freeze({ changed: false, tab, ...evaluation });
  return Object.freeze({
    changed: true,
    tab: Object.freeze({ ...tab, sleeping: true }),
    ...evaluation,
  });
}

export function wakeTab(tabInput) {
  const tab = requireTab(tabInput);
  if (tab.sleeping !== true) return Object.freeze({ ...tab });
  return Object.freeze({ ...tab, sleeping: false });
}

/**
 * Build a recoverable "Recently Cleaned" archive batch.
 * Protected tabs are never swept. The default keeps at least one tab open.
 */
export function sweepUntouchedTabs(tabInputs, {
  now,
  untouchedThresholdMs,
  maxArchive,
} = {}) {
  if (!Array.isArray(tabInputs)) throw new TypeError("tabs must be an array");
  validateTiming({ now, idleThresholdMs: untouchedThresholdMs });

  const tabs = tabInputs.map((tab) => requireTab(tab));
  const ids = new Set();
  for (const tab of tabs) {
    if (ids.has(tab.id)) throw new RangeError("Duplicate tab id: " + tab.id);
    ids.add(tab.id);
  }

  const cap = maxArchive === undefined ? Math.max(0, tabs.length - 1) : maxArchive;
  if (!Number.isInteger(cap) || cap < 0) throw new RangeError("maxArchive must be a non-negative integer");

  const candidates = tabs
    .map((tab) => {
      const reason = protectedReason(tab, { ignoreSleeping: true });
      const idleForMs = idleDuration(tab, now);
      return { tab, reason, idleForMs };
    })
    .filter((candidate) =>
      !candidate.reason
      && candidate.idleForMs !== null
      && candidate.idleForMs >= untouchedThresholdMs
    )
    .sort((a, b) => b.idleForMs - a.idleForMs)
    .slice(0, cap);

  const archivedIds = new Set(candidates.map((candidate) => candidate.tab.id));
  const archivedAt = now;
  const archiveEntries = candidates.map(({ tab }) => Object.freeze({
    id: "cleaned-" + tab.id,
    reason: "recently-cleaned",
    closedAt: archivedAt,
    tab: Object.freeze({ ...tab, sleeping: false, active: false }),
  }));

  return Object.freeze({
    remainingTabs: Object.freeze(tabs.filter((tab) => !archivedIds.has(tab.id))),
    archiveEntries: Object.freeze(archiveEntries),
  });
}

export function restoreRecentlyCleanedEntry(entry) {
  if (entry === null || typeof entry !== "object" || Array.isArray(entry) || entry.reason !== "recently-cleaned") {
    throw new TypeError("Invalid Recently Cleaned archive entry");
  }
  const tab = requireTab(entry.tab);
  return Object.freeze({ ...tab, sleeping: false, active: false });
}
