import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { contrastRatio, MINIMUM_RATIO } from "../design/contrast.mjs";
import { SPACE_MOODS } from "../prototype/core.mjs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const tokens = JSON.parse(read("../design/tokens.json"));
const css = read("../design/tokens.css");

const HEX = /^#[0-9a-f]{6}$/i;
const kebab = (name) => name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

function block(header) {
  const start = css.indexOf(`${header} {`);
  assert.notEqual(start, -1, `tokens.css is missing the block: ${header}`);
  return css.slice(start, css.indexOf("}", start));
}

function declaredHex(body) {
  const found = {};
  for (const match of body.matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) found[match[1]] = match[2].toUpperCase();
  return found;
}

function palette(theme) {
  if (theme === "highContrast") return { ...tokens.night, ...tokens.highContrast };
  return tokens[theme];
}

test("contrast helper matches known WCAG reference values", () => {
  assert.equal(Math.round(contrastRatio("#000000", "#FFFFFF")), 21);
  assert.equal(contrastRatio("#FFFFFF", "#FFFFFF"), 1);
  assert.throws(() => contrastRatio("red", "#FFFFFF"), TypeError);
});

test("every palette value in tokens.json is a valid #RRGGBB color", () => {
  for (const theme of ["night", "day", "highContrast"]) {
    for (const [name, value] of Object.entries(tokens[theme])) assert.match(value, HEX, `${theme}.${name}`);
  }
});

test("tokens.css declares the same palette values as tokens.json", () => {
  const checks = [
    [':root, [data-theme="night"]', tokens.night],
    ['[data-theme="day"]', tokens.day],
    ['[data-contrast="high"]', tokens.highContrast],
  ];
  for (const [header, expected] of checks) {
    const actual = declaredHex(block(header));
    for (const [name, value] of Object.entries(expected)) {
      assert.equal(actual[kebab(name)], value.toUpperCase(), `${header} --${kebab(name)}`);
    }
  }
});

test("every var(--x) used in tokens.css is declared", () => {
  const declared = new Set([...css.matchAll(/(--[a-z-]+):/g)].map((match) => match[1]));
  for (const match of css.matchAll(/var\((--[a-z-]+)\)/g)) assert.ok(declared.has(match[1]), `undeclared ${match[1]}`);
});

test("declared contrast pairs meet their role minimum and reproduce the brief", () => {
  for (const pair of tokens.contrast) {
    const colors = palette(pair.theme);
    assert.ok(colors[pair.fg] && colors[pair.bg], `unknown token in ${JSON.stringify(pair)}`);
    const ratio = contrastRatio(colors[pair.fg], colors[pair.bg]);
    const label = `${pair.theme}: ${pair.fg} on ${pair.bg} = ${ratio.toFixed(2)}`;
    if (pair.role !== "decorative") assert.ok(ratio >= MINIMUM_RATIO[pair.role], `${label} is below ${MINIMUM_RATIO[pair.role]}`);
    if (pair.brief !== null) assert.ok(Math.abs(ratio - pair.brief) <= 0.1, `${label} differs from the brief value ${pair.brief}`);
  }
});

test("decorative-only tokens are never used as text or essential UI foregrounds", () => {
  for (const pair of tokens.contrast) {
    if (pair.role === "decorative") continue;
    assert.ok(!tokens.decorativeOnly.includes(pair.fg), `${pair.fg} is decorative-only but used as ${pair.role}`);
  }
});

test("documented avoid pairs stay accurate and really are below the threshold", () => {
  for (const entry of tokens.avoid) {
    const colors = palette(entry.theme);
    const ratio = contrastRatio(colors[entry.fg], colors[entry.bg]);
    assert.ok(Math.abs(ratio - entry.observed) <= 0.05, `${entry.fg} on ${entry.bg} is now ${ratio.toFixed(2)}; update the avoid list`);
    assert.ok(ratio < 4.5, `${entry.fg} on ${entry.bg} now passes AA text; remove it from the avoid list`);
  }
});

test("every Space mood from the prototype has tokens and a CSS block", () => {
  assert.deepEqual(Object.keys(tokens.moods).sort(), [...SPACE_MOODS].sort());
  for (const [mood, values] of Object.entries(tokens.moods)) {
    assert.ok(tokens.night[values.accent], `${mood} accent ${values.accent} is not a Night token`);
    const body = block(`[data-mood="${mood}"]`);
    assert.ok(body.includes(`--accent: var(--${kebab(values.accent)})`), `${mood} accent mismatch in CSS`);
    assert.ok(body.includes(`--grain: ${values.grain}`), `${mood} grain mismatch in CSS`);
    assert.ok(body.includes(`--glow: ${values.glow}`), `${mood} glow mismatch in CSS`);
  }
});

test("each mood accent keeps AA text contrast on the Night surfaces", () => {
  for (const [mood, values] of Object.entries(tokens.moods)) {
    for (const surface of ["void", "umber", "study"]) {
      const ratio = contrastRatio(tokens.night[values.accent], tokens.night[surface]);
      assert.ok(ratio >= 4.5, `${mood} accent ${values.accent} on ${surface} is ${ratio.toFixed(2)}`);
    }
  }
});

test("private Spaces force grain and glow off regardless of mood", () => {
  const body = block('[data-space-kind="private"]');
  assert.ok(body.includes("--grain: 0;") && body.includes("--glow: 0;"));
});

test("reduced motion removes the heartbeat and shortens every duration", () => {
  const section = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
  assert.ok(section.includes("--heartbeat: 0ms;"));
  for (const name of ["--dur-micro", "--dur-std", "--dur-large"]) assert.ok(section.includes(`${name}: 100ms;`));
});
