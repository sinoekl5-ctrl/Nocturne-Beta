# Spec: Command bar

- **Status:** Draft
- **Matrix:** Ardia core ideas, Adopt/Port, score 22 (highest in the matrix)
- **Layer:** logic in L2, interface in L3

## Purpose

One field for addresses, searches, open tabs, history, quick calculation and actions. It lives in the sidebar so the page can reach the top edge of the window.

## Decision

The parsing and ranking logic is a pure, dependency-free module that can run in tests without a browser. `prototype/core.mjs` is the starting point. The UI is a separate component.

## Input classification

Input is classified in this order and the first match wins:

1. **Empty:** show recent items for the current Space.
2. **Action:** begins with the action prefix (provisional `>`), matched against a fixed registry of Nocturne actions.
3. **Calculation:** matches the safe arithmetic grammar. Evaluated by the existing parser, never with `eval` or `Function`.
4. **Address:** a valid URL or host after normalization.
5. **Search:** everything else, offered as a web search plus local matches.

The prototype implements calculation, address and local filtering. Actions and the search handoff are new.

## Findings from reading `prototype/core.mjs`

These are specification inputs, not bug reports about a prototype:

- `isLikelyAddress` accepts only a fixed list of top-level domains (`com`, `org`, `net`, `io`, `dev`, `app`, `co`, `local`, `test`, `preview`). Real use needs a public-suffix-aware check, IPv4 and IPv6 literals, internationalized domain names, and single-label intranet hosts when the user explicitly types a scheme.
- Addresses are recognized by regular expression on the raw string. The production module MUST parse with the platform URL parser and make decisions on the parsed result.
- Calculation accepts ASCII digits only. Whether to accept Arabic-Indic digits is an open decision (see below). It matters because Arabic is a first-class target.
- `calculateExpression` rounds to 8 decimals. The spec keeps that, and also caps input length and nesting depth so a hostile or pasted string cannot cause deep recursion.

## Safety rules for address handling

- `javascript:`, `data:` and `file:` inputs MUST NOT be offered as an address result from typed input. Only `http`, `https` and the internal scheme are navigable from the bar.
- URLs with embedded credentials (`user:pass@host`) are shown with a warning and are never auto-opened.
- Lookalike and mixed-script hosts are displayed in their punycode form with a visible marker.
- Pasted text containing newlines is collapsed to a single line before classification.

## Results and ranking

Each result has `kind`, `title`, `subtitle`, `value` and a short `reason` label, as in the prototype. Order: exact action match, calculation, address, open tabs in the current Space, other-Space tabs (labeled), history, bookmarks, web search. Ties are broken by recency. Alternate rows get the faint 3 to 4 percent tint from the Gambit design.

The bar searches the current Space by default. Searching other Spaces is explicit (a prefix or a toggle) so results never leak across the isolation boundary by surprise.

## Privacy

- No remote suggestion requests by default. Search suggestions from an engine are opt-in per Space.
- History and open-tab data used for ranking never leaves the device.
- Private Spaces are not searched from other Spaces, and their results never appear in a standard Space's bar.

## Keyboard

Focus: `Ctrl/Cmd + L` (as in the prototype). Navigate results with arrow keys. Enter opens, `Ctrl/Cmd + Enter` opens in a new tab, Escape clears then closes. Shortcuts are provisional and must not collide with Chromium defaults without a deliberate decision.

## Edge cases

- Input that is both a valid calculation and a plausible address (for example `1.5`): calculation wins, and the address interpretation is shown as the second result.
- Division by zero, unbalanced parentheses, overflow: no calculator result, the input falls through to the next classifier.
- Very long input: truncated for display, rejected for calculation above the length cap.
- Input method editors (Arabic, Chinese, Japanese): classification MUST NOT run on uncommitted composition text.
- Result list empty: one calm sentence in the Nocturne voice, no error styling.

## Accessibility and RTL

The field and list use the combobox and listbox pattern with the active result announced. Focus is a 2 px ember outline plus a shape change. In right-to-left layouts the field text direction follows the input, and results mirror. Numbers in calculation results keep their own direction.

## Acceptance tests

Pure-module unit tests: classification order table, each safety rule above, calculator grammar and caps, IDN and IPv6 cases, tie-breaking, and a test that no result ever contains data from another Space unless explicitly requested. UI tests: keyboard-only operation, screen-reader announcement, IME composition, right-to-left mirroring.

## Open questions

1. Action prefix and the initial action registry.
2. Arabic-Indic digits in the calculator, yes or no.
3. Which default search engine, and how it is chosen without making a commercial deal the product's default behavior.
4. Whether bookmarks exist in v1 or only pins and folders.
