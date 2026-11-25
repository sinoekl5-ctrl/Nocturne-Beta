import {
  calculateExpression,
  isLikelyAddress,
  buildOmniboxSuggestions,
} from "../browser-core/omnibox.mjs";

export { calculateExpression, isLikelyAddress };

export function buildSuggestions(query, items, options = {}) {
  const list = Array.isArray(items) ? items : [];
  return buildOmniboxSuggestions(query, {
    tabs: list.filter((item) => item.kind === "tab"),
    actions: list.filter((item) => item.kind === "action"),
    history: options.history ?? [],
    bookmarks: options.bookmarks ?? [],
    cleanLinksMode: options.cleanLinksMode ?? "suggest",
    maxResults: options.maxResults ?? 8,
  });
}

export const SPACE_MOODS = Object.freeze(["atelier", "gambit", "vigil", "drift", "ember"]);

export function createSpaceState(mood = "atelier") {
  const safeMood = SPACE_MOODS.includes(mood) ? mood : "atelier";
  return { mood: safeMood, private: safeMood === "vigil", tabs: [], pins: [] };
}
