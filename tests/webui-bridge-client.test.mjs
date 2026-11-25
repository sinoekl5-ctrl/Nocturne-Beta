import test from "node:test";
import assert from "node:assert/strict";
import { createWebUiBridgeClient } from "../packages/core/webui-bridge-client.mjs";

function makeClient(send = () => {}, requestIdFactory = () => "test_req-1") {
  return createWebUiBridgeClient({ send, requestIdFactory });
}

test("exposes only the three protocol-v1 actions", () => {
  const client = makeClient();
  assert.deepEqual(Object.keys(client), ["getState", "activateSpace", "activateTab"]);
});

test("sends the exact minimal state request", () => {
  const sent = [];
  const request = makeClient((value) => sent.push(value)).getState();
  assert.deepEqual(request, {
    ok: true,
    requestId: "test_req-1",
    action: "shell.getState",
    payload: {}
  });
  assert.equal(sent.length, 1);
  assert.equal(sent[0], request);
});

test("constructs a typed Space activation request", () => {
  const sent = [];
  makeClient((value) => sent.push(value)).activateSpace("atelier-work");
  assert.equal(sent[0].action, "spaces.activate");
  assert.deepEqual(sent[0].payload, { spaceId: "atelier-work" });
});

test("constructs a typed tab activation request", () => {
  const sent = [];
  makeClient((value) => sent.push(value)).activateTab("tab_abc");
  assert.equal(sent[0].action, "tabs.activate");
  assert.deepEqual(sent[0].payload, { tabId: "tab_abc" });
});

test("rejects invalid Space IDs before transport", () => {
  let calls = 0;
  assert.throws(() => makeClient(() => calls++).activateSpace("../profile"), /Invalid bridge request/);
  assert.equal(calls, 0);
});

test("rejects invalid tab handles before transport", () => {
  let calls = 0;
  assert.throws(() => makeClient(() => calls++).activateTab("tab 1"), /Invalid bridge request/);
  assert.equal(calls, 0);
});

test("rejects malformed request IDs before transport", () => {
  let calls = 0;
  assert.throws(
    () => makeClient(() => calls++, () => "bad request id").getState(),
    /Invalid bridge request/
  );
  assert.equal(calls, 0);
});

test("requires a transport and request ID factory", () => {
  assert.throws(() => createWebUiBridgeClient(), /send must be a function/);
  assert.throws(
    () => createWebUiBridgeClient({ send() {}, requestIdFactory: 1 }),
    /requestIdFactory must be a function/
  );
});

test("propagates transport failures without retrying", () => {
  let calls = 0;
  const client = makeClient(() => {
    calls++;
    throw new Error("transport unavailable");
  });
  assert.throws(() => client.getState(), /transport unavailable/);
  assert.equal(calls, 1);
});

test("client surface is immutable", () => {
  const client = makeClient();
  assert.equal(Object.isFrozen(client), true);
});
