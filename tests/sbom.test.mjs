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

test('CSV rejects malformed quoting and inconsistent row widths', () => {
  assert.throws(() => parseCsv('a,b\n"unterminated,b\n'), /Unterminated quoted CSV field/);
  assert.throws(() => parseCsv('a,b\n1,2,3\n'), /expected 2$/);
  assert.throws(() => parseCsv('a,b\n"quoted"tail,2\n'), /Unexpected character after closing CSV quote/);
});

test('upstream CSV keeps comma-containing Ardia role in the correct field', () => {
  const ardia = pins().find((pin) => pin.repository === 'ardia-browser/ardia');
  assert.equal(ardia.observed_role, 'Chromium browser UX, Linux host, evolving Windows host');
  assert.equal(ardia.decision, 'Port behavior; audit any code');
  assert.equal(ardia.checked_at_utc, '2026-11-25');
  assert.equal(ardia.notes, 'Current engine-build docs use Chromium 158.0.8127.36 and Helium 0.22.2; not same as current Helium root main pin');
});

test('duplicate repositories and invalid audit dates are rejected', () => {
  const rows = pins();
  assert.throws(() => buildSbom([...rows, rows[0]]), /Duplicate repository pin/);
  rows[0] = { ...rows[0], checked_at_utc: '2026-02-31' };
  assert.throws(() => buildSbom(rows), /Invalid checked_at_utc date/);
});
