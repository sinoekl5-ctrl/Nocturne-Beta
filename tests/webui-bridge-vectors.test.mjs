import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateWebUiBridgeRequest } from "../packages/core/webui-bridge-contract.mjs";

const fixture = JSON.parse(await readFile(new URL("./fixtures/webui-bridge-v1.json", import.meta.url), "utf8"));

test("shared WebUI bridge v1 vectors match the reference contract", () => {
  assert.equal(fixture.protocolVersion, 1);
  assert.ok(fixture.cases.length >= 15);
  for (const vector of fixture.cases) {
    const frame = vector.frameContext === undefined ? fixture.trustedFrame : vector.frameContext;
    let request = vector.request;
    if (vector.serializedUtf8Bytes !== undefined) {
      const emptySize = new TextEncoder().encode(JSON.stringify(request)).byteLength;
      const paddingBytes = vector.serializedUtf8Bytes - emptySize;
      assert.ok(paddingBytes >= 0, vector.name);
      request = structuredClone(request);
      request.payload.padding = "x".repeat(paddingBytes);
      assert.equal(new TextEncoder().encode(JSON.stringify(request)).byteLength, vector.serializedUtf8Bytes, vector.name);
    }
    const actual = validateWebUiBridgeRequest(request, frame);
    assert.equal(actual.ok, vector.expected.ok, vector.name);
    if (vector.expected.ok) {
      assert.equal(actual.action, vector.expected.action, vector.name);
    } else {
      assert.equal(actual.reason, vector.expected.reason, vector.name);
    }
  }
});
