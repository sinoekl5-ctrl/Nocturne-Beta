#!/usr/bin/env node
// Generates a CycloneDX 1.5 *source-pin* inventory from docs/third-party/upstream-pins.csv.
//
// Scope: this lists the pinned upstream repositories only. It is NOT a dependency-level SBOM:
// it does not include Chromium, Helium patches' third-party code, npm/pip/NuGet/Cargo trees
// or build toolchains. Phase 1 stays open until a machine-generated, dependency-level SBOM
// exists for the chosen engine set (see docs/phase-0-checklist.md).
//
// Usage:
//   node scripts/generate_sbom.mjs           write docs/third-party/sbom.cdx.json
//   node scripts/generate_sbom.mjs --check   exit 1 if the committed file is out of date
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const PINS_PATH = resolve(ROOT, 'docs/third-party/upstream-pins.csv');
export const SBOM_PATH = resolve(ROOT, 'docs/third-party/sbom.cdx.json');

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  let afterQuote = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { quoted = false; afterQuote = true; }
      } else { field += c; }
      continue;
    }
    if (afterQuote) {
      if (c === ' ' || c === '\t') continue;
      if (c !== ',' && c !== '\n' && c !== '\r') throw new Error(`Unexpected character after closing CSV quote at offset ${i}`);
      afterQuote = false;
    }
    if (c === '"') {
      if (field !== '') throw new Error(`Unexpected CSV quote at offset ${i}`);
      quoted = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((value) => value !== '')) rows.push(row);
      row = [];
    } else { field += c; }
  }
  if (quoted) throw new Error('Unterminated quoted CSV field');
  if (field !== '' || row.length) {
    row.push(field);
    if (row.some((value) => value !== '')) rows.push(row);
  }
  if (!rows.length) throw new Error('CSV is empty');
  const [header, ...body] = rows;
  if (header.some((name) => !name) || new Set(header).size !== header.length) throw new Error('CSV header contains an empty or duplicate column name');
  return body.map((values, index) => {
    if (values.length !== header.length) throw new Error(`CSV row ${index + 2} has ${values.length} fields; expected ${header.length}`);
    return Object.fromEntries(header.map((name, i) => [name, values[i]]));
  });
}

export function buildSbom(pins) {
  const seen = new Set();
  for (const pin of pins) {
    for (const key of ['repository', 'ref', 'commit', 'license_summary', 'observed_role', 'decision', 'checked_at_utc', 'notes']) {
      if (!pin[key]?.trim()) throw new Error(`Pin for ${pin.repository || '(unknown repository)'} is missing ${key}`);
    }
    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(pin.repository)) throw new Error(`Invalid GitHub repository: ${pin.repository}`);
    if (seen.has(pin.repository)) throw new Error(`Duplicate repository pin: ${pin.repository}`);
    seen.add(pin.repository);
    const date = new Date(`${pin.checked_at_utc}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(pin.checked_at_utc) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== pin.checked_at_utc) {
      throw new Error(`Invalid checked_at_utc date for ${pin.repository}: ${pin.checked_at_utc}`);
    }
  }
  const dates = pins.map((p) => p.checked_at_utc).sort();
  const components = pins
    .map((p) => {
      if (!/^[0-9a-f]{40}$/.test(p.commit)) {
        throw new Error(`Pin for ${p.repository} is not a 40-character commit SHA`);
      }
      const [owner, name] = p.repository.split('/');
      if (!owner || !name) throw new Error(`Invalid repository: ${p.repository}`);
      const purl = `pkg:github/${owner}/${name}@${p.commit}`;
      return {
        type: 'library',
        'bom-ref': purl,
        name: p.repository,
        version: p.commit,
        purl,
        description: p.observed_role,
        licenses: [{ license: { name: p.license_summary } }],
        externalReferences: [{ type: 'vcs', url: `https://github.com/${p.repository}` }],
        properties: [
          { name: 'nocturne:ref', value: p.ref },
          { name: 'nocturne:decision', value: p.decision },
          { name: 'nocturne:checked-at', value: p.checked_at_utc },
          { name: 'nocturne:notes', value: p.notes },
        ],
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  return {
    bomFormat: 'CycloneDX',
    specVersion: '1.5',
    version: 1,
    metadata: {
      ...(dates.length ? { timestamp: `${dates[dates.length - 1]}T00:00:00Z` } : {}),
      component: { type: 'application', name: 'nocturne', 'bom-ref': 'nocturne' },
      properties: [
        { name: 'nocturne:scope', value: 'source-pin-inventory-only' },
        { name: 'nocturne:generated-from', value: 'docs/third-party/upstream-pins.csv' },
      ],
    },
    components,
  };
}

export function renderSbom(pins) {
  return `${JSON.stringify(buildSbom(pins), null, 2)}\n`;
}

function main() {
  const pins = parseCsv(readFileSync(PINS_PATH, 'utf8'));
  const output = renderSbom(pins);
  if (process.argv.includes('--check')) {
    let current = '';
    try { current = readFileSync(SBOM_PATH, 'utf8'); } catch { /* missing */ }
    if (current !== output) {
      console.error('docs/third-party/sbom.cdx.json is out of date; run: node scripts/generate_sbom.mjs');
      process.exit(1);
    }
    console.log(`SBOM is up to date (${pins.length} pinned components).`);
    return;
  }
  writeFileSync(SBOM_PATH, output);
  console.log(`Wrote ${SBOM_PATH} (${pins.length} pinned components).`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
