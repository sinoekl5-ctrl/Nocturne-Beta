# Phase 0 and Phase 1/2 status

## Phase 0 — foundation

- [x] Record Windows, Linux and macOS as first-release targets.
- [x] Record cross-platform Chromium foundation and early visual prototype direction.
- [x] Create project README and repository structure.
- [x] Add GNU GPL v3 license text and project NOTICE (working policy; legal review remains required).
- [x] Add provenance template, source/license policy, architecture and visual specification.
- [x] Add contribution/security guidance and GitHub Actions validation.
- [x] Foundation GitHub Actions run passed on 2026-11-25 (run `45587070432`).

## Phase 1 — source audit

- [x] Inspect all five candidate repositories' public metadata, default-branch trees, READMEs and license records.
- [x] Pin the five source repositories by immutable commit in `docs/third-party/upstream-pins.csv`.
- [x] Inspect selected Helium build metadata and platform packaging READMEs; pin the three packaging repositories.
- [x] Inspect Phi open-source build, Crest architecture/trademark policy, Ardia Linux/Windows/build/cross-platform docs, and urlshortener-ui design guide.
- [x] Record first-pass Adopt / Port / Specify / Skip decisions and the cross-platform WebUI hypothesis.
- [ ] Clone and reproduce the selected upstream engine build on representative Windows, Linux and macOS machines.
- [ ] Verify exact compatible Chromium/Helium/platform-package pin set and minimum OS versions.
- [ ] Produce a machine-generated SBOM from the chosen, pinned source/dependency set before distributing binaries.
- [ ] Complete legal review of GPL-3.0 and any mixed file-level licenses before distributing builds.

## Phase 2 — visual prototype

- [x] Create a dependency-free local web prototype based on the brief's tokens and layout.
- [x] Implement five Space mood switches, sidebar/command bar, sample tabs/folders, split-view concept and reading mode.
- [x] Add Day Study, high contrast, reduced motion, RTL mirroring and texture controls.
- [x] Add Node unit tests for the command parser/calculator and Space normalization.
- [x] Local Node tests and foundation checks pass; local preview server returns HTTP 200.
- [ ] Human visual review on real displays, low brightness, keyboard-only and screen readers.
- [ ] Native Arabic typography/shaping review; current UI includes RTL mirroring but does not yet ship a complete Arabic translation.
- [ ] Approve the visual system before connecting it to the privileged Chromium shell.

## Still open from Phase 0

- [ ] Decide maintainer/team model and review process.
- [ ] Conduct trademark and domain review for Nocturne; no clearance is implied.
- [ ] Select minimum supported Windows/macOS versions and initial Linux distribution/packaging matrix.
- [ ] Confirm build hardware/CI capacity: disk, RAM, CPU, native runners, artifact caching and cost.
- [ ] Confirm whether the five-source list is final; urlshortener-ui is a URL-shortener dashboard, not a browser.
- [ ] Confirm first-run mood (the brief proposes Atelier).
- [ ] Decide whether Arabic/RTL is a v1 release gate or a beta-readiness gate; design remains RTL-aware either way.

## Verification boundary

The local prototype is a UI preview only. It does not render websites or provide Chromium navigation, secure Spaces, extensions, downloads or browser processes. Foundation CI runs documentation validation and the prototype's Node tests; it does not build Chromium. Engine and platform workflows must be added only after the source/build pins and native toolchains are established.
