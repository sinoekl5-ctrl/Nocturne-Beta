# Nocturne implementation plan

This plan aligns the 25 November 2026 source audit with the requested Windows, Linux and macOS targets. Estimates from the original brief are indicative only and depend heavily on build hardware.

## Current status

- **Phase 0 — Foundation:** repository, governance, license baseline, architecture and first CI complete.
- **Phase 1 — Source/document audit:** pinned source metadata/trees/licenses/build docs and first-pass decisions complete; native build reproduction and SBOM remain open.
- **Phase 2 — Visual prototype:** first local UI prototype implemented and unit-tested; human visual/accessibility review remains open.
- **Phase 3 onward:** not started; no Chromium integration or runnable browser yet.

## Phase 0 — Foundations (brief estimate: about 1 week)

Deliverables: project charter, platform decision, GPL/NOTICE baseline, provenance template, architecture, visual specification, governance, foundation CI and open-decision list.

**Exit:** complete. Remaining administrative/legal items are explicitly tracked in `docs/phase-0-checklist.md`.

## Phase 1 — Source and build audit (brief estimate: 2–3 weeks)

### Completed in this audit

- Inspected the five candidate repositories' public metadata, default-branch trees, READMEs, licenses and selected source/build documents.
- Pinned each candidate's `main` commit and all three Helium platform-packaging repositories.
- Corrected stale platform assumptions: current Ardia has Linux Chromium-hosted UI work and Windows alpha/WebUI work; its Windows history and docs include hardware and feature limitations.
- Recorded the difference between Helium's current main Chromium pin (`158.0.8127.88`) and the Ardia document's engine pin (`158.0.8127.36` + Helium 0.22.2).
- Scored initial Adopt / Port / Specify / Skip decisions in the source audit.

### Remaining

1. Clone the pinned repositories into a dedicated audit workspace and generate a machine-readable SBOM.
2. Establish a matching Chromium + Helium + macOS/Linux/Windows packaging revision set; do not combine mismatched upstream versions.
3. Build and run the engine on representative native environments. Record exact OS, CPU, disk, RAM, elapsed time, failures and output hashes.
4. Validate the proposed Chromium WebUI integration and native bridge trust boundary on each platform.
5. Complete file-level license/provenance review and legal review before binary distribution.

**Exit:** every feature has an Adopt/Port/Specify/Skip decision; the exact engine pin is reproducible; supported OS versions and native build matrix are documented.

## Phase 2 — Visual prototype (brief estimate: 2 weeks)

### Implemented

- Dependency-free static app served by Node, with original CSS illustration and no external runtime dependencies.
- Sidebar, address/command entry, pins, sample tabs/folders, Space switcher and five mood tokens.
- Command palette filtering sample tabs/actions, address preview, and safe arithmetic parser (no `eval`).
- Split view, reading-mode concept, private-room visual state, Day Study, high contrast, reduced motion, texture controls and RTL mirroring.
- Unit tests for calculator parsing, address recognition, suggestions and Space normalization.

### Remaining

- Human review on real displays, low brightness, keyboard-only and assistive technology.
- Review real Arabic text shaping and companion fonts; current prototype demonstrates RTL mirroring but is not a complete Arabic translation.
- Validate every implemented text/icon contrast pairing against WCAG on actual rendered colors.
- Approve the visual system before integration into a privileged Chromium page.

**Exit:** design sign-off, five moods and key states reviewed, accessibility/RTL/motion acceptance passed, no unlicensed assets.

## Phase 3 — Chromium engine base (brief estimate: 2–4 weeks after audit)

- Pin Chromium source, Helium root and matching platform package revisions.
- Establish a reproducible build/caching environment sized for Chromium; keep build host and artifact provenance documented.
- Register a minimal `chrome://nocturne/` WebUI and a narrow typed native bridge.
- Prove origin/frame checks and deny calls from ordinary web pages.
- Apply Nocturne application identity without copying Helium branding; keep Nocturne patches distinct.

**Exit:** installable browser alpha with real navigation and a minimal shared shell on Windows, Linux and macOS; smoke tests pass on each platform. This is not satisfied by the current visual prototype.

## Phase 4 — Shell and Spaces (brief estimate: 6–12 weeks)

Implement real Chromium-backed tabs, pins, folders, sessions, split view, Peek and URL routing. Map each Space to Chromium profile/BrowserContext primitives. Add automated leakage tests for cookies, local storage, cache, service workers, permissions, downloads and history. Implement Private Space temporary storage and cleanup with process/window lifecycle tests.

**Exit:** automated data isolation and lifecycle tests pass on all supported platforms; sustained daily-use trial shows no data loss.

## Phase 5 — Privacy and import (brief estimate: 3–5 weeks)

Integrate the approved, license-reviewed blocker/filter-list path; URL cleaner with Disable/Suggest/Auto-clean modes; selected safe importers; local Insights; onboarding.

**Exit:** tested import without data loss, readable privacy controls, Insights local-only, no telemetry by default.

## Phase 6 — Beta readiness (brief estimate: 4–8 weeks)

Accessibility, Arabic/RTL, performance budgets measured from real baselines, opt-in crash reporting, security update exercise, SBOM/provenance and installation docs.

**Exit:** no known data-loss or critical isolation defects; security update process proven; all three release-candidate matrices pass.

## Later, not v1 commitments

Optional local-first assistant, user-owned encrypted sync, second engine and mobile. Each requires a separate decision and threat/license review.
