# Chromium WebUI integration spike — status and exit gates

- **Status:** pre-integration contract tests implemented; Chromium host integration not started.
- **Target:** a Nocturne-owned `chrome://nocturne/` page shared by Windows, Linux, and macOS.
- **Decision owner:** Nocturne maintainers.

## Why the first slice is deliberately small

The existing `prototype/` is an interaction/visual study and is not privileged
browser UI. The next safe step is to agree and test the browser-to-UI message
contract before wiring any privileged API. The executable contract lives in
`spikes/chromium-webui/bridge-contract.mjs`; hostile-input and negative tests
live in `tests/webui-bridge.test.mjs` and run under the existing `npm test`
command.

The initial actions are intentionally limited to:

| Action | Input | Browser-side behavior |
|---|---|---|
| `getVersion` | Empty object | Return a non-sensitive product/version string only |
| `openUrl` | One HTTP(S) URL | Navigate a browser-owned tab after browser-process validation |
| `setSpaceMood` | One of the five fixed mood IDs | Update presentation state only; it must not change storage isolation |

No bridge action may read credentials, inspect arbitrary page content, access
filesystem paths, execute commands, or choose a profile directory.

## Required Chromium implementation work

This repository currently has no Chromium checkout or GN build graph. Therefore
C++ file paths, `BUILD.gn` dependencies, WebUI registration hooks, and exact
upstream API signatures must be selected from the **pinned source checkout**,
not guessed from a different Chromium release.

When the compatible upstream set is established:

1. Reproduce a Chromium + Helium root + platform-package combination and record
   all immutable SHAs, toolchain versions, host OS, and build instructions.
2. Register one browser-owned WebUI controller for `chrome://nocturne/` using
   the APIs present in that exact checkout.
3. Serve a minimal static page with a visible build/version marker; do not embed
   the standalone prototype wholesale.
4. Implement a C++ message handler for the three actions above. Derive the
   caller's committed origin and frame from Chromium's `RenderFrameHost`; do
   not trust renderer-supplied identity claims. Require the primary main frame
   and the Nocturne WebUI origin.
5. Validate message count, JSON types, exact allowed keys, request ID length,
   URL scheme, URL credentials, and the fixed mood enumeration in C++.
6. Add browser tests for the happy path and hostile origins/frames, plus tests
   proving that `javascript:`, `data:`, `file:`, privileged `chrome:` URLs and
   URL-embedded credentials cannot reach the navigation dispatcher.
7. Build and launch on a representative native environment. Record exact
   commands, duration, outputs, failures, and artifact hashes. Repeat on each
   supported OS before declaring cross-platform support.

## Pin compatibility blocker

`docs/third-party/upstream-pins.csv` currently records Helium main at Chromium
`158.0.8127.88`, while the audited Ardia engine-build document references
Chromium `158.0.8127.36` with Helium `0.22.2`. Those pins must not be combined
without a reproducible compatibility proof. The Helium platform packaging
repositories are separate pins and must be validated against the same root
revision. Until then, Chromium C++/GN integration files would be speculative.

## Exit criteria

- [ ] One immutable, reproducible Chromium/Helium/platform-package set selected.
- [ ] Minimal `chrome://nocturne/` controller compiles and loads.
- [ ] Typed browser-to-WebUI request/response round trip works.
- [ ] Non-Nocturne and non-primary-frame requests are rejected in browser process.
- [ ] Browser-side URL validation rejects unsafe schemes and credentials.
- [ ] Browser tests pass on at least one native platform.
- [ ] Equivalent page and bridge smoke tests pass on Windows, Linux, and macOS.

Until every required gate is satisfied, this is a **pre-integration spike**, not a
working Chromium browser shell.
