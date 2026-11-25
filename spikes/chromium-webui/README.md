# Chromium WebUI bridge contract spike

This directory contains the **pre-integration contract test** for a proposed
`chrome://nocturne/` page. It is intentionally independent of Chromium so that
message shape, URL restrictions, and negative cases can be tested in ordinary
Node CI before a large Chromium checkout/build is available.

## Current result

- A narrow JSON request envelope with a bounded request ID.
- Three initial actions only: `getVersion`, `openUrl`, and `setSpaceMood`.
- `openUrl` accepts HTTP(S) only and rejects embedded credentials, `file:`,
  `data:`, `javascript:`, and other privileged schemes.
- Unknown actions and unrecognized fields are rejected.
- Tests assert that the caller context must identify the exact Nocturne WebUI
  origin and the primary main frame.

Run the contract tests from the repository root with:

```sh
node --test tests/webui-bridge.test.mjs
```

## Critical security boundary

`isTrustedBridgeContext()` is a **testable policy model**, not proof of renderer
identity. In the Chromium implementation, the browser process must derive the
origin, WebUI status, and frame identity from Chromium-owned objects such as
`RenderFrameHost` and `WebContents`. Never accept those values from JavaScript,
message payloads, URL parameters, or an ordinary website. Check the primary
main frame and the committed `chrome://nocturne` origin before dispatching.

The eventual C++ host must additionally:

1. Register only explicit message names and validate each argument count/type.
2. Reject calls from non-primary frames and non-Nocturne origins.
3. Dispatch only this allow-listed contract; do not expose filesystem paths,
   credentials, arbitrary commands, profile paths, or unrestricted IPC.
4. Re-validate URLs in the browser process immediately before navigation.
5. Return bounded, typed responses and avoid leaking sensitive browser state.

## What this spike does not prove

This does not register a Chromium WebUI controller, compile C++, build Chromium,
launch a browser, or prove that any OS can load `chrome://nocturne/`. It does not
connect to the standalone visual prototype. The WebUI registration API and GN
wiring must be written against one reproducible Chromium + Helium + platform
packaging revision set, then compiled and smoke-tested on native runners.
