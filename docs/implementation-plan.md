# Nocturne implementation plan

The plan adapts the project brief to Windows, Linux, macOS, a cross-platform Chromium foundation,
and an early visual prototype. Durations are indicative estimates from the brief, not commitments.

## Phase 0 — Foundations (brief estimate: about 1 week)
Deliverables: project charter, platform decision, license/NOTICE, provenance template, architecture,
visual prototype specification, governance notes, foundation CI, open-decision list.
Exit: required files exist, validation passes, platform direction is recorded, and no unlicensed
assets or upstream implementation code are bundled. Before engine work, record minimum OS targets,
build capacity, exact source pins, and license review.

## Phase 1 — Source/build audit (brief estimate: 2–3 weeks)
Pin all five source repositories; inventory languages, dependencies, licenses, file notices,
platforms, and build requirements. Build/run each browser where feasible, starting with Helium.
Inspect Crest's Space model and Ardia's portable core/omnibox. Write behavior specs, score features,
and produce an SBOM.
Exit: every feature has Adopt, Port, Specify, or Skip; reproducible engine build path or blocker is
documented; exact reuse/license decisions and OS matrix are approved.

## Phase 2 — Visual prototype (brief estimate: 2 weeks)
Build tokens, typography, matte surfaces, optional texture, sidebar, command bar, pinned tiles,
tabs/folders, Space switcher, split view, and empty/private states. Demonstrate five mood changes,
keyboard navigation, contrast, high contrast, reduced motion, and RTL.
Exit: all five moods and key states are testable; visual review and accessibility checks pass;
no protected reference paintings or unlicensed brand assets are included.

## Phase 3 — Chromium engine base (brief estimate: 2–4 weeks after audit)
Pin Chromium/Helium commits, establish repeatable build and artifact caching, apply minimal Nocturne
identity, isolate custom patches, and add installation/navigation smoke tests.
Exit: installable alpha and passing smoke tests on Windows, Linux, and macOS; security rebasing is
documented and exercised.

## Phase 4 — Shell and Spaces (brief estimate: 6–12 weeks)
Integrate sidebar and command bar; implement tabs, pins, folders, archive, isolated Spaces,
permissions/settings, split view, Peek, routing, and tab sleeping where supported.
Exit: automated storage-isolation tests pass; sustained daily-use trial shows no known data loss.

## Phase 5 — Privacy and import (brief estimate: 3–5 weeks)
Integrate approved content-blocking/filter-list approach; add URL cleaner with Disable/Suggest/
Auto-clean; selected safe importers; local Insights; onboarding.
Exit: tested import without data loss; clear privacy controls; Insights remains local-only.

## Phase 6 — Beta readiness (brief estimate: 4–8 weeks)
Accessibility and Arabic/RTL pass; measured performance targets; opt-in crash reporting; Chromium
security-update exercise; documentation, SBOM, provenance, and install instructions.
Exit: no known data-loss or critical isolation defects; all three platform release candidates pass.

## Later, not v1 commitments
Optional local-first assistant, user-owned encrypted sync, second engine, and mobile.
