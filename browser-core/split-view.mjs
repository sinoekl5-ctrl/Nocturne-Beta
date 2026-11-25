/**
 * Pure layout model for Nocturne's two- or three-pane Split View.
 * This module does not create Chromium WebContents or control real navigation.
 */

const ORIENTATIONS = Object.freeze(["vertical", "horizontal"]);

function freezeView(orientation, paneIds, activePaneId) {
  return Object.freeze({
    orientation,
    paneIds: Object.freeze(paneIds.slice()),
    activePaneId,
  });
}

function validatePaneIds(paneIds) {
  if (!Array.isArray(paneIds) || paneIds.length < 2 || paneIds.length > 3) {
    throw new RangeError("Split View requires two or three panes");
  }
  const normalized = paneIds.map((id) => {
    if (typeof id !== "string" || !id.trim()) throw new TypeError("Pane tab IDs must be non-empty strings");
    return id;
  });
  if (new Set(normalized).size !== normalized.length) throw new RangeError("Split View panes must use distinct tabs");
  return normalized;
}

function requireView(view) {
  if (!view || typeof view !== "object" || Array.isArray(view)) throw new TypeError("Split View state must be an object");
  if (!ORIENTATIONS.includes(view.orientation)) throw new RangeError("Unknown Split View orientation");
  validatePaneIds(view.paneIds);
  if (!view.paneIds.includes(view.activePaneId)) throw new RangeError("Active pane must be part of Split View");
  return view;
}

export function createSplitView(paneIds, orientation = "vertical", activePaneId = paneIds?.[0]) {
  if (!ORIENTATIONS.includes(orientation)) throw new RangeError("Unknown Split View orientation");
  const panes = validatePaneIds(paneIds);
  if (!panes.includes(activePaneId)) throw new RangeError("Active pane must be part of Split View");
  return freezeView(orientation, panes, activePaneId);
}

export function addSplitPane(view, tabId) {
  requireView(view);
  if (view.paneIds.length >= 3) throw new RangeError("Split View supports at most three panes");
  if (typeof tabId !== "string" || !tabId.trim()) throw new TypeError("Pane tab ID must be a non-empty string");
  if (view.paneIds.includes(tabId)) throw new RangeError("Tab is already in Split View");
  return freezeView(view.orientation, [...view.paneIds, tabId], view.activePaneId);
}

export function removeSplitPane(view, tabId) {
  requireView(view);
  if (!view.paneIds.includes(tabId)) throw new RangeError("Tab is not in Split View");
  const panes = view.paneIds.filter((id) => id !== tabId);
  if (panes.length < 2) return null;
  const active = view.activePaneId === tabId ? panes[0] : view.activePaneId;
  return freezeView(view.orientation, panes, active);
}

export function activateSplitPane(view, tabId) {
  requireView(view);
  if (!view.paneIds.includes(tabId)) throw new RangeError("Tab is not in Split View");
  return freezeView(view.orientation, view.paneIds, tabId);
}

export function setSplitOrientation(view, orientation) {
  requireView(view);
  if (!ORIENTATIONS.includes(orientation)) throw new RangeError("Unknown Split View orientation");
  return freezeView(orientation, view.paneIds, view.activePaneId);
}

export function reorderSplitPanes(view, orderedPaneIds) {
  requireView(view);
  const panes = validatePaneIds(orderedPaneIds);
  if (panes.length !== view.paneIds.length || panes.some((id) => !view.paneIds.includes(id))) {
    throw new RangeError("Reordered panes must contain the same tabs");
  }
  return freezeView(view.orientation, panes, view.activePaneId);
}
