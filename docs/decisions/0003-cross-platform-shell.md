# ADR 0003: Cross-platform browser shell direction

- **Status:** Proposed; validate with a Chromium WebUI spike before freezing
- **Date:** 2026-11-25
- **Related:** ADR 0001, `docs/audits/2026-11-25-source-audit.md`

## Context

Nocturne targets Windows, Linux and macOS and should not maintain three unrelated native browser shells. The current Ardia audit shows a Chromium-hosted WebUI shell on Linux and a later Windows WebUI direction, while the first Windows alpha history demonstrates native-host complexity and incomplete behavior. Helium remains the best candidate engine/patch foundation, but its platform packaging repositories are separate. The current Chromium/Helium pins in Ardia and Helium are not identical.

## Decision direction

1. Keep Helium as the engine/patch foundation candidate, subject to reproducible, aligned source pins and platform build verification.
2. Prototype a **Nocturne-owned Chromium WebUI shell**, provisionally hosted as `chrome://nocturne/`, using a shared web UI for sidebar, command bar, tabs/folders, Space selection, split-view controls and internal pages.
3. Put OS-only work (window frame, native menus, credential store, notifications, file dialogs, installer/update integration) behind narrow per-platform adapters. A shared UI does not remove native packaging or security work.
4. Define a typed, allow-listed bridge between the privileged WebUI and browser host. Validate origin/frame identity and each request schema; reject arbitrary page-origin calls. Do not expose credentials, profile paths or unrestricted filesystem access to the WebUI.
5. Use the dependency-free `prototype/` app as the interaction and visual reference. Do not embed it directly into a Chromium privileged context without a separate security review.
6. Do not copy Ardia host or application code during the spike. Reimplement the minimum vertical slice and record provenance if any upstream file is later proposed for reuse.

## Minimum validation spike

- Build the same pinned Chromium/Helium baseline on at least one representative environment.
- Register one internal WebUI page and load a small shared Nocturne shell.
- Demonstrate a typed request/response pair and one browser-owned tab action.
- Prove ordinary website origins cannot call the privileged bridge.
- Confirm the same UI bundle loads on Windows, Linux and macOS; record native adapter differences rather than assuming parity.
- Re-run after an upstream Chromium/Helium update to measure patch and WebUI maintenance.

## Consequences

This is a promising shared-shell direction, not yet a proven architecture. It may reduce duplicated UI code while increasing dependence on Chromium WebUI APIs and the Chromium patch/update cycle. If the minimal spike fails on one platform or relies on unsupported internals, reopen this ADR and compare other cross-platform hosting approaches before feature work.
