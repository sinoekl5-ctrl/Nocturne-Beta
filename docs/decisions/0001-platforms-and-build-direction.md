# ADR 0001: Platform targets and build direction

- **Status:** Accepted
- **Date:** 2026-11-25
- **Decision owners:** Nocturne maintainer

## Context

The project brief compares three approaches: a Helium-based Chromium fork with a Nocturne interface, native shells around embedded Chromium, and a short-lived theme/extension prototype. The maintainer has selected a cross-platform Chromium foundation and an early visual prototype.

## Decision

1. The first-release platform targets are **Windows, Linux, and macOS**.
2. Nocturne will pursue the cross-platform Chromium-fork approach (Approach A in the project brief), using Helium's patch-based Chromium build as the primary candidate engine/privacy foundation.
3. The Nocturne visual prototype will be developed and reviewed early, independently of the full Chromium build, to validate the visual language and interaction model before expensive engine integration.
4. The product will aim for one cross-platform shell/interface architecture, not three unrelated native browser shells.
5. Upstream Chromium and Helium commits, minimum OS versions, the exact UI framework, build hosts, and the patch-rebase policy remain to be pinned during the source/build audit. No upstream revision is considered pinned by this ADR.

## Consequences

- Chromium patch maintenance and security rebasing become permanent engineering responsibilities.
- Build automation must eventually cover all three target operating systems, with a documented support matrix.
- Platform-specific integration must be isolated behind narrow interfaces; platform-specific behavior must not leak into browser-core logic.
- The visual prototype is a validation artifact, not a substitute for a real Chromium-backed browser.
- The first browser release must not be declared cross-platform until installable builds and smoke tests pass on Windows, Linux, and macOS.

## Revisit when

The Helium/Chromium audit shows a blocking platform limitation, an unacceptable maintenance burden, or an incompatible licensing/build requirement. Any change requires a new decision record.
