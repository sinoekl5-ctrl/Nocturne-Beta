import { cleanLink } from "./url-cleaner.mjs";

const SAFE_MATH = /^[\d\s()+\-*/%.]+$/;

export function calculateExpression(source) {
  const input = String(source).replace(/\s+/g, "");
  if (!input || !SAFE_MATH.test(input)) return null;
  let index = 0;

  function expression() {
    let value = term();
    while (input[index] === "+" || input[index] === "-") {
      const operator = input[index++];
      const right = term();
      value = operator === "+" ? value + right : value - right;
    }
    return value;
  }

  function term() {
    let value = factor();
    while (["*", "/", "%"].includes(input[index])) {
      const operator = input[index++];
      const right = factor();
      if ((operator === "/" || operator === "%") && right === 0) throw new Error("Division by zero");
      value = operator === "*" ? value * right : operator === "/" ? value / right : value % right;
    }
    return value;
  }

  function factor() {
    if (input[index] === "+" || input[index] === "-") {
      const sign = input[index++] === "-" ? -1 : 1;
      return sign * factor();
    }
    if (input[index] === "(") {
      index++;
      const value = expression();
      if (input[index++] !== ")") throw new Error("Unbalanced parentheses");
      return value;
    }
    const match = input.slice(index).match(/^(?:\d+(?:\.\d*)?|\.\d+)/);
    if (!match) throw new Error("Expected a number");
    index += match[0].length;
    return Number(match[0]);
  }

  try {
    const result = expression();
    if (index !== input.length || !Number.isFinite(result)) return null;
    return Number(result.toFixed(8));
  } catch {
    return null;
  }
}

export function isLikelyAddress(value) {
  const text = String(value).trim();
  if (!text || /\s/.test(text)) return false;
  return /^(https?:\/\/|localhost(?::\d+)?(?:\/.*)?$|[\w-]+\.(?:local|test|preview|com|org|net|io|dev|app|co)(?::\d+)?(?:\/.*)?$)/i.test(text);
}

function normalizeList(value) {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === "object") : [];
}

function itemText(item) {
  return [item.title, item.subtitle, item.url, item.keywords, item.command]
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .filter((value) => typeof value === "string")
    .join(" ")
    .toLocaleLowerCase();
}

function scoreMatch(query, item) {
  const title = String(item.title ?? "").toLocaleLowerCase();
  const url = String(item.url ?? "").toLocaleLowerCase();
  const all = itemText(item);
  if (title === query) return 120;
  if (title.startsWith(query)) return 100;
  if (url.startsWith(query)) return 90;
  if (title.includes(query)) return 75;
  if (all.includes(query)) return 55;
  return 0;
}

function actionMatches(action, query) {
  const command = String(action.command ?? "").toLocaleLowerCase();
  const title = String(action.title ?? "").toLocaleLowerCase();
  const searchable = itemText(action);
  return command === query || title.includes(query) || searchable.includes(query);
}

function mapResult(item, kind, reason) {
  return {
    ...item,
    id: String(item.id ?? item.command ?? item.title ?? kind),
    title: String(item.title ?? item.url ?? "Untitled"),
    subtitle: String(item.subtitle ?? item.url ?? ""),
    url: item.url,
    kind,
    reason,
    value: item.url ?? item.command ?? item.action ?? item.title ?? "",
  };
}

function recentItems({ tabs, history, bookmarks, actions }, maxResults) {
  const result = [];
  for (const item of tabs) result.push(mapResult(item, "tab", "Open tab"));
  const recentHistory = history.slice().sort((a, b) => {
    const left = typeof a.visitedAt === "number" ? a.visitedAt : Date.parse(a.visitedAt ?? "") || 0;
    const right = typeof b.visitedAt === "number" ? b.visitedAt : Date.parse(b.visitedAt ?? "") || 0;
    return right - left;
  });
  for (const item of recentHistory) result.push(mapResult(item, "history", "History"));
  for (const item of bookmarks) result.push(mapResult(item, "bookmark", "Bookmark"));
  for (const item of actions) result.push(mapResult(item, "action", "Action"));
  return result.slice(0, maxResults);
}

/**
 * Pure command-bar/omnibox matcher over current-Space records.
 * Supports tabs, local history, bookmarks/pins, actions, calculator and URLs.
 * It never calls the network or performs navigation.
 */
export function buildOmniboxSuggestions(query, {
  tabs = [],
  history = [],
  bookmarks = [],
  actions = [],
  cleanLinksMode = "suggest",
  maxResults = 8,
} = {}) {
  const sources = {
    tabs: normalizeList(tabs),
    history: normalizeList(history),
    bookmarks: normalizeList(bookmarks),
    actions: normalizeList(actions),
  };
  const limit = Math.max(1, Math.min(20, Number.isFinite(maxResults) ? Math.floor(maxResults) : 8));
  const text = String(query ?? "").trim();
  if (!text) return recentItems(sources, limit);

  const calculation = calculateExpression(text);
  if (calculation !== null) {
    return [{
      id: "calculator",
      title: String(calculation),
      subtitle: "Calculate " + text,
      kind: "calculator",
      reason: "Calculator",
      value: String(calculation),
    }];
  }

  if (isLikelyAddress(text)) {
    const cleaned = cleanLink(text, { mode: cleanLinksMode });
    if (cleaned.action === "suggested") {
      return [
        {
          id: "clean-link",
          title: "Open clean link",
          subtitle: "Remove " + cleaned.removedParameters.join(", ") + " · preview only",
          kind: "clean-link",
          reason: "Clean link",
          value: cleaned.cleanedUrl,
          originalUrl: text,
          removedParameters: cleaned.removedParameters,
        },
        {
          id: "original-address",
          title: "Open original link",
          subtitle: text,
          kind: "address",
          reason: "Original",
          value: text,
        },
      ];
    }
    if (cleaned.action === "cleaned") {
      return [{
        id: "address",
        title: cleaned.url,
        subtitle: "Tracking parameters removed in this preview",
        kind: "address",
        reason: "Auto-clean",
        value: cleaned.url,
        originalUrl: text,
      }];
    }
    return [{
      id: "address",
      title: text,
      subtitle: "Website navigation is not connected in this preview",
      kind: "address",
      reason: "Address",
      value: text,
    }];
  }

  const actionQuery = text.startsWith(">") ? text.slice(1).trim().toLocaleLowerCase() : text.toLocaleLowerCase();
  const commandAlias = sources.actions.some((action) => String(action.command ?? "").toLocaleLowerCase() === actionQuery);
  if (text.startsWith(">") || commandAlias) {
    return sources.actions
      .filter((action) => !actionQuery || actionMatches(action, actionQuery))
      .map((action) => mapResult(action, "action", "Command"))
      .slice(0, limit);
  }

  const candidates = [
    ...sources.tabs.map((item) => ({ item, kind: "tab", priority: 4, reason: "Current Space tab" })),
    ...sources.bookmarks.map((item) => ({ item, kind: "bookmark", priority: 3, reason: "Bookmark" })),
    ...sources.history.map((item) => ({ item, kind: "history", priority: 2, reason: "History" })),
    ...sources.actions.map((item) => ({ item, kind: "action", priority: 1, reason: "Action" })),
  ];

  const matches = candidates
    .map((candidate) => ({ ...candidate, score: scoreMatch(text.toLocaleLowerCase(), candidate.item) }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || b.priority - a.priority)
    .slice(0, limit)
    .map((candidate) => mapResult(candidate.item, candidate.kind, candidate.reason));

  if (matches.length) return matches;
  return [{
    id: "search",
    title: "Search for “" + text + "”",
    subtitle: "Search provider is not connected in this preview",
    kind: "search",
    reason: "Search",
    query: text,
    value: text,
  }];
}
