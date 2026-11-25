# Privileged WebUI bridge contract

- **Status:** protocol/reference contract only; no Chromium WebUI or native bridge is implemented.
- **Proposed page:** chrome://nocturne/
- **Protocol version:** 1
- **Maximum serialized request size:** 8 KiB

## Purpose and security boundary

Nocturne's proposed shared shell is a privileged Chromium WebUI. A website must never be able to invoke browser-owned actions through that shell bridge. The JavaScript validator in packages/core/webui-bridge-contract.mjs is a reference oracle for protocol shape and regression tests only. It is not a security boundary, does not authenticate a renderer, and is not wired into the prototype.

The future native Chromium host must independently enforce every rule before dispatch. It must derive the caller context from Chromium's committed frame and WebContents state, not from fields supplied by JavaScript. At minimum it must require the exact chrome://nocturne origin, a committed document, the expected WebUI controller, and the primary main frame. Same-origin subframes, ordinary web origins, untrusted navigations and stale/uncommitted documents are denied.

Do not use window.postMessage as an authorization mechanism. Do not make a message's self-reported origin, URL, frame ID, process ID, Space ID or profile identity authoritative. The native host must resolve tab and Space handles against browser-owned objects and verify that the target belongs to the active permitted browser context.

## Request envelope

A request is a plain object with exactly four properties:

| Property | Type | Rule |
|---|---|---|
| version | integer | Must equal 1 |
| requestId | string | 1–64 ASCII letters, digits, underscore or hyphen |
| action | string | Must be one of the fixed action names below |
| payload | object | Must match the selected action exactly; unknown properties are rejected |

The UTF-8 serialization must not exceed 8 KiB. Unknown envelope properties, unknown protocol versions, malformed identifiers, non-object values and malformed payloads fail closed. The protocol does not accept arbitrary method names, JavaScript source, URLs, file paths or nested command expressions.

## Initial action allowlist

| Action | Exact payload | Intended effect |
|---|---|---|
| shell.getState | empty object | Return minimal, non-sensitive shell state |
| spaces.activate | { spaceId: string } | Activate an existing Space after host-side ownership checks |
| tabs.activate | { tabId: string } | Activate an existing browser-owned tab handle after host-side context checks |

Space handles use a lowercase slug of 1–32 characters, beginning with a letter and containing only lowercase letters, digits or hyphens. Tab handles are opaque 1–64 character ASCII identifiers; they must not expose a raw native object pointer or WebContents identifier. The host must ensure the referenced object exists and is in the intended browser context. A syntactically valid handle is not authorization.

No action in protocol version 1 may read credentials, cookies, raw profile paths, unrestricted filesystem data, arbitrary page contents, or execute script in a website. New actions require a protocol/version review, explicit payload schema, native authorization rule, and negative tests.

## Native host requirements before this can be called secure

1. Register the page and resources through Chromium's privileged WebUI machinery; serve only packaged local resources and reject unexpected paths.
2. Apply a restrictive Content Security Policy, avoid inline/eval script, enable Trusted Types where supported, and do not load remote script or styles.
3. Bind the message handler only to the Nocturne WebUI and validate the actual committed origin and primary main frame for every request.
4. Parse a strict versioned envelope, apply the same byte budget, reject extra keys and unknown actions, and validate every payload again in native code.
5. Authorize each operation against browser-owned state. In particular, resolve opaque tab handles and Space IDs on the host and verify context membership before changing active state.
6. Return only the minimum state needed by the UI. Never serialize credentials, cookies, authentication tokens, filesystem paths or profile directories.
7. Add Chromium-native unit/browser tests for trusted main frame success, website-origin denial, same-origin subframe denial, navigation races, malformed requests, unknown actions, invalid handles and cross-Space tab activation.
8. Review the WebUI surface for XSS and unsafe resource exposure. A compromised trusted UI can still exercise every bridge action granted to it.

## Reference validator and test coverage

The dependency-free reference validator is covered by tests/webui-bridge-contract.test.mjs. It exercises accepted request shapes and fail-closed handling for untrusted origins, non-WebUI frames, subframes, uncommitted documents, unsupported versions, malformed request IDs, unknown actions, extra payload fields and oversized UTF-8 messages.

Those Node tests prove only that the reference protocol contract behaves as documented. They do not prove Chromium origin isolation, renderer process isolation, native callback security, CSP behavior, or any working browser action. Those claims require the native Chromium spike and browser-level tests.

## Exit criteria for the Chromium spike

- Build and launch the pinned engine baseline on at least one properly provisioned native host.
- Load a registered chrome://nocturne/ page using local resources.
- Dispatch one typed browser-owned tab activation action from the trusted primary frame.
- Demonstrate denial from ordinary website origins and same-origin subframes in Chromium-native tests.
- Record the Chromium/Helium source pins, toolchain, logs and artifact hashes. Cross-platform support is not established until the same vertical slice passes on Windows, Linux and macOS.

## Shared conformance vectors

`tests/fixtures/webui-bridge-v1.json` is the language-neutral acceptance/denial corpus for protocol v1. The Node reference tests consume it directly; future Chromium C++ unit/browser tests should load the same vectors (using an adapter from fixture frame context to browser-owned test frame state) to prevent JS/native drift. Fixture `frameContext` values are synthetic test inputs only: production code must derive caller identity from Chromium and must never trust renderer-supplied context.

The corpus covers the three allow-listed actions, website and wrong-WebUI origins, subframes, uncommitted frames, malformed/extra envelope and payload fields, unknown actions/versions, invalid identifiers, invalid host context, and the exact 8 KiB / 8 KiB + 1 UTF-8 boundaries. These tests validate the reference protocol only; they do not prove Chromium process or origin isolation.
