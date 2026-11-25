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
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { quoted = false; }
      } else { field += c; }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = ''; rows.push(row); row = [];
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const [header, ...body] = rows.filter((r) => r.some((v) => v !== ''));
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
}

export function buildSbom(pins) {
  const dates = pins.map((p) => p.checked_at_utc).filter(Boolean).sort();
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
