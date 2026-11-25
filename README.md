# NOCTURNE

*A private, painterly browser for people who think at night.*

Nocturne is a planned desktop browser for **Windows, Linux and macOS**. Its engine direction is a cross-platform Chromium foundation informed by [Helium](https://github.com/imputnet/helium). The product shell is intended to be shared across platforms, with narrowly scoped native adapters.

> **Project status (25 November 2026):** foundation, source audit and dependency-free visual prototype are committed. The browser-core now includes the three-mode Clean Links logic, a Spaces model with per-room collections and history rules, an omnibox matcher for tabs, history, pins, actions, addresses and arithmetic, a conservative tab sleep/Recently Cleaned policy, and a two/three-pane Split View state model. **This is not yet a browser:** there is no Chromium checkout, browser process, real website navigation, enforced profile isolation, installer or release build in the default branch. Feature branches remain under review.

## Run the prototype

Requires Node.js 20 or newer. No package installation or external dependencies are needed:

```sh
npm run dev
```

Open `http://127.0.0.1:4173`.

The prototype demonstrates the sidebar, command bar (`Ctrl/Cmd + L`), sample tabs/folders, pins, five Space moods, split-view concept, reading mode, Day Study, high contrast, reduced motion, RTL mirroring and a preview of the Clean Links modes. It uses original CSS illustration only. Its page is a static mockup and it makes no external website requests. “Private room” remains a visual state, not a security boundary. See [prototype/README.md](prototype/README.md).

## Run checks

```sh
npm test
python scripts/validate_foundation.py
```

After a native Chromium/Helium build exists, run the [clean-profile HTTPS smoke test](docs/browser-smoke-test.md) against its executable. It verifies launch and rendered DOM output; it is not a release certification.

## Product principles

- **Private by default.** No mandatory account, no telemetry by default, no background dependency on Google services; crash reporting and future metrics are opt-in.
- **Rooms, not piles.** Spaces are distinct browsing environments with separate data and permissions, not just tab folders.
- **Real Chromium.** Version 1 targets Chromium compatibility, not a new rendering engine.
- **Quiet by design.** Sidebar-first, matte and restrained. The website remains the brightest object on screen.
- **Honest and accessible.** Safe defaults, visible privacy controls, keyboard access, reduced motion and Arabic/RTL from the start.

## Target platforms

| Platform | First-release target | Minimum OS version |
|---|---|---|
| Windows | Yes | Set after native build audit |
| Linux | Yes | Distribution and package baseline to be set |
| macOS | Yes | Set after native build audit |

## Current architecture direction

1. **L0 — Engine:** pinned Chromium source built through a compatible Helium patch/tooling set and matching platform packaging repositories.
2. **L1 — Privacy and hardening:** de-Googling, content blocking, filter lists and privacy flags.
3. **L2 — Browser core:** Spaces, storage isolation, omnibox, URL rules and tab lifecycle.
4. **L3 — Shell and interface:** a Nocturne-owned shared Chromium WebUI candidate, with narrow OS adapters.
5. **L4 — Features and services:** importers, updates and command actions.
6. **L5 — Internal pages:** start page, settings, Insights and onboarding.

The Chromium WebUI direction remains a **proposed architecture**. A JavaScript message-contract spike exists on a separate review branch; it does not register a Chromium controller or enforce browser-process security. See [ADR 0003](docs/decisions/0003-cross-platform-shell.md).

## Core feature contracts

- [Clean Links](docs/features/url-cleaner.md) — local Disable / Suggest / Auto-clean query-parameter policy; not yet connected to Chromium navigation.
- [Spaces](docs/features/spaces.md) — validated metadata, per-room tabs/pins/folders/history, and private-room lifecycle policy; Chromium profile isolation is not implemented.
- [Command Bar](docs/features/command-bar.md) — local matching for tabs, history, pins, commands and calculator; search/navigation providers are not connected.
- [Tab lifecycle](docs/features/tab-lifecycle.md) — tested sleep eligibility and recoverable Recently Cleaned candidate selection; no Chromium renderer is frozen.
- [Split View](docs/features/split-view.md) — state model for two or three panes; no native WebContents are composed yet.

## Source audit

The five candidate repositories have been inspected and pinned. The audit records their observed platform/build status, license notes and Adopt / Port / Specify / Skip decisions:

- [Source audit, 25 November 2026](docs/audits/2026-11-25-source-audit.md)
- [Immutable upstream pins](docs/third-party/upstream-pins.csv)
- [Architecture](docs/architecture.md)
- [Engine source lock and build readiness](docs/engine-build-readiness.md)
- [Native engine build runbook](docs/native-engine-build-runbook.md)
- [Manual native build workflow](.github/workflows/native-engine-build.yml)

The audited Helium root pin names Chromium **158.0.8127.88**. Ardia's audited engine-build document uses Chromium **158.0.8127.36** with Helium **0.22.2**; those are not interchangeable pin sets. Nocturne must reproduce one coherent set before starting a browser build.

## Five Space moods

| Mood | Intended use | Character |
|---|---|---|
| Atelier | Work | Warm umber/olive-brown and restrained ember focus |
| Gambit | Research | Near-black and parchment, deliberate contrast |
| Vigil | Private | Nearly monochrome, minimal grain, no warm glow |
| Drift | Media and leisure | Deep slate-blue with a cold wind accent |
| Ember | Home and saved things | Brown-black with one warm amber focus |

The supplied paintings are private moodboard references only. They must not be redistributed, bundled, used as wallpapers or used in marketing without the artists' permission. Shipped art must be original or separately licensed.

## Version 1 boundaries

No second rendering engine, mandatory AI, vendor-operated cloud sync or mobile app. No mandatory account. Optional local-first AI and user-owned sync are later decisions, not v1 commitments.

## Repository map

```text
.github/workflows/       Foundation + cross-platform core checks
browser-core/             Dependency-free browser logic and policy models
prototype/                Dependency-free visual/interaction prototype
scripts/                  Local serving and repository validation
tests/                    Node tests for core helpers and policy models
docs/audits/              Dated upstream/source audit
docs/decisions/           Architecture decision records
docs/design/              Visual prototype specification
docs/features/            User-visible feature contracts and enforcement boundaries
docs/third-party/         Immutable source pins and provenance
```

## License

The working project baseline is **GNU GPL version 3.0 only**. See [LICENSE](LICENSE), [NOTICE](NOTICE) and [ADR 0002](docs/decisions/0002-license-and-third-party-material.md). This is project policy, not legal advice. Recheck every dependency, imported file and notice before distribution.
