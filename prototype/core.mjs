import { cleanLink } from "../browser-core/url-cleaner.mjs";

const SAFE_MATH = /^[\d\s()+\-*/%.]+$/;

/** Evaluate a deliberately small arithmetic grammar without eval(). */
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

export function buildSuggestions(query, items, { cleanLinksMode = "suggest" } = {}) {
  const text = String(query ?? "").trim();
  if (!text) return items.slice(0, 6).map((item) => ({ ...item, reason: item.reason ?? "Recent" }));

  const calculation = calculateExpression(text);
  if (calculation !== null) {
    return [{ id: "calculator", title: String(calculation), subtitle: `Calculate ${text}`, kind: "calculator", reason: "Calculator", value: String(calculation) }];
  }

  if (isLikelyAddress(text)) {
    const cleanResult = cleanLink(text, { mode: cleanLinksMode });
    if (cleanResult.action === "suggested") {
      return [
        {
          id: "clean-link",
          title: "Open clean link",
          subtitle: `Remove ${cleanResult.removedParameters.join(", ")} · preview only`,
          kind: "clean-link",
          reason: "Clean link",
          value: cleanResult.cleanedUrl,
          originalUrl: text,
          removedParameters: cleanResult.removedParameters,
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
    if (cleanResult.action === "cleaned") {
      return [{
        id: "address",
        title: cleanResult.url,
        subtitle: "Tracking parameters removed in this preview",
        kind: "address",
        reason: "Auto-clean",
        value: cleanResult.url,
        originalUrl: text,
      }];
    }
    return [{
      id: "address",
      title: text,
      subtitle: "Open in the browser · simulated in this prototype",
      kind: "address",
      reason: "Address",
      value: text,
    }];
  }

  const normalized = text.toLocaleLowerCase();
  return items
    .filter((item) => `${item.title} ${item.subtitle ?? ""} ${item.url ?? ""}`.toLocaleLowerCase().includes(normalized))
    .slice(0, 6)
    .map((item) => ({ ...item, reason: item.reason ?? "On this device" }));
}

export const SPACE_MOODS = Object.freeze(["atelier", "gambit", "vigil", "drift", "ember"]);

export function createSpaceState(mood = "atelier") {
  const safeMood = SPACE_MOODS.includes(mood) ? mood : "atelier";
  return { mood: safeMood, private: safeMood === "vigil", tabs: [], pins: [] };
}
