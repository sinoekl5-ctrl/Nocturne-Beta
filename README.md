# NOCTURNE

*A private, painterly browser for people who think at night.*

Nocturne is a planned desktop browser for **Windows, Linux and macOS**. Its engine direction is a cross-platform Chromium foundation informed by [Helium](https://github.com/imputnet/helium). The product shell is intended to be shared across platforms, with narrowly scoped native adapters.

> **Project status (25 November 2026):** foundation and first source audit are committed; a dependency-free visual/interaction prototype can be run locally. **This is not yet a browser:** there is no Chromium checkout, browser process, real navigation, secure profile isolation, installer or release build in this repository.

## Run the prototype

Requires Node.js 20 or newer. No package installation or external dependencies are needed:

```sh
npm run dev
```

Open `http://127.0.0.1:4173`.

The prototype demonstrates the sidebar, command bar (`Ctrl/Cmd + L`), sample tabs/folders, pins, five Space moods, split-view concept, reading mode, Day Study, high contrast, reduced motion and RTL mirroring. It uses original CSS illustration only. Its page is a static mockup and it makes no external website requests. “Private room” is a visual state, not a security boundary. See [prototype/README.md](prototype/README.md).

Run local checks:

```sh
npm test
python scripts/validate_foundation.py
```

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

1. **L0 — Engine:** pinned Chromium source built through a compatible Helium patch/tooling set and the matching platform packaging repositories.
2. **L1 — Privacy and hardening:** de-Googling, content blocking, filter lists and privacy flags.
3. **L2 — Browser core:** Spaces, storage isolation, omnibox, URL rules and tab lifecycle.
4. **L3 — Shell and interface:** a Nocturne-owned shared Chromium WebUI candidate, with narrow OS adapters.
5. **L4 — Features and services:** importers, updates and command actions.
6. **L5 — Internal pages:** start page, settings, Insights and onboarding.

The cross-platform Chromium WebUI direction is a **proposed architecture** awaiting a real `chrome://nocturne/` integration/security spike. See [ADR 0003](docs/decisions/0003-cross-platform-shell.md). It is informed by Ardia's current Linux/Windows WebUI work but does not copy Ardia code.

## Source audit

The five candidate repositories have been inspected and pinned. The audit records their actual current platform/build status, license notes and first-pass Adopt / Port / Specify / Skip decisions:

- [Source audit, 25 November 2026](docs/audits/2026-11-25-source-audit.md)
- [Immutable upstream pins](docs/third-party/upstream-pins.csv)
- [Architecture](docs/architecture.md)

The latest audited Helium `main` pin names Chromium **158.0.8127.88**. Ardia's current engine-build document uses Chromium **158.0.8127.36** with Helium **0.22.2**; those are not interchangeable pin sets. Nocturne must reproduce one coherent set before starting a browser build.

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
.github/workflows/       Foundation + prototype checks
prototype/                Dependency-free visual/interaction prototype
scripts/                   Local serving and repository validation
tests/                     Node tests for pure browser-core helpers
docs/audits/              Dated upstream/source audit
 docs/decisions/          Architecture decision records
 docs/design/             Visual prototype specification
docs/third-party/         Immutable source pins and provenance
```

## License

The working project baseline is **GNU GPL version 3.0 only**. See [LICENSE](LICENSE), [NOTICE](NOTICE) and [ADR 0002](docs/decisions/0002-license-and-third-party-material.md). This is project policy, not legal advice. Recheck every dependency, imported file and notice before distribution.
