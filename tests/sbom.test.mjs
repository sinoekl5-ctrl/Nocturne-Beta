import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseCsv, buildSbom, renderSbom, PINS_PATH, SBOM_PATH } from '../scripts/generate_sbom.mjs';

const pins = () => parseCsv(readFileSync(PINS_PATH, 'utf8'));

test('parseCsv handles quoted commas, escaped quotes and CRLF', () => {
  const rows = parseCsv('a,b\r\n"x,1","he said ""hi"""\r\n');
  assert.deepEqual(rows, [{ a: 'x,1', b: 'he said "hi"' }]);
});

test('every pin becomes one component with a purl and a 40-char version', () => {
  const rows = pins();
  const sbom = buildSbom(rows);
  assert.equal(sbom.bomFormat, 'CycloneDX');
  assert.equal(sbom.components.length, rows.length);
  for (const c of sbom.components) {
    assert.match(c.version, /^[0-9a-f]{40}$/);
    assert.equal(c.purl, `pkg:github/${c.name}@${c.version}`);
    assert.ok(c.properties.some((p) => p.name === 'nocturne:decision' && p.value));
  }
});

test('output is deterministic and independent of row order', () => {
  const rows = pins();
  assert.equal(renderSbom(rows), renderSbom([...rows].reverse()));
});

test('a pin that is not a full commit SHA is rejected', () => {
  const rows = pins();
  rows[0] = { ...rows[0], commit: 'main' };
  assert.throws(() => buildSbom(rows), /40-character commit SHA/);
});

test('SBOM declares its limited scope', () => {
  const props = buildSbom(pins()).metadata.properties;
  assert.ok(props.some((p) => p.name === 'nocturne:scope' && p.value === 'source-pin-inventory-only'));
});

test('committed sbom.cdx.json matches upstream-pins.csv', () => {
  assert.equal(readFileSync(SBOM_PATH, 'utf8'), renderSbom(pins()));
});
