# Proposed architecture

- Status: Proposed baseline aligned with ADR 0001.
- Targets: Windows, Linux, macOS.
- Engine direction: Chromium, using Helium's patch-based build as the primary candidate.

## Six layers
1. L0 Engine — pinned Chromium source and repeatable builds through the Helium patch/tooling series.
2. L1 Privacy — de-Googling, flags, content blocking, filter lists, and opt-in crash reports.
3. L2 Browser core — Spaces, storage model, omnibox, URL rules, and tab lifecycle.
4. L3 Shell — sidebar, tabs, folders, split view, Peek, command bar, theme, and motion.
5. L4 Features/services — importers, updates, command actions, and later optional services.
6. L5 Internal pages — start page, settings, Insights, and onboarding.

Each layer depends only on the layer below it. Keep Nocturne-specific Chromium patches small and
isolated. See the visual prototype specification in docs/design/visual-prototype.md.

## Cross-platform strategy
Use one Chromium-based product architecture for all three platforms. Avoid beginning with a
Swift-only, macOS-only React Native shell, or three independently maintained native shells.
Platform-specific behavior must be isolated behind narrow adapters. The exact UI framework and
Chromium integration points remain audit decisions; do not select them before testing the current
upstream build and packaging model.

## Space model
A Space is a first-class browsing environment, not just a tab folder. Its intended boundary includes
cookies, site data, cache, history, permissions, tabs, pins, folders, credentials, settings, and one
of five visual moods. Map this model to Chromium's actual profile/BrowserContext/storage primitives.
Test cookies, local storage, cache, permissions, service workers, downloads, and history for leakage
before claiming isolation. Private Spaces use temporary storage and must have a tested cleanup
lifecycle. Sub-Spaces that share sign-ins are a later design problem and must not weaken isolation.

## Privacy and engineering rules
- No telemetry by default; crash reporting is opt-in and excludes URLs/page contents.
- No mandatory account; no vendor-operated cloud sync in v1.
- Pin Chromium, patch-set, and dependency versions.
- Keep Nocturne patches separate from upstream patches.
- Automate rebasing, builds, smoke tests, and security-update reporting.
- Maintain an SBOM and provenance ledger.
- Design Arabic/RTL, keyboard access, focus visibility, contrast, and reduced motion in from day one.
- Website content remains untinted and brighter than the browser chrome.

## Deferred decisions
Minimum OS versions, initial Linux distribution matrix, shell/UI framework, credential-store
integration, build hardware/CI, filter-list update policy, Sub-Spaces, and any sync protocol.
