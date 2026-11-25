# NOCTURNE

*A private, painterly browser for people who think at night.*

Nocturne is a planned desktop browser for **Windows, Linux, and macOS**. The product direction is a cross-platform Chromium foundation, informed by the privacy work in [Helium](https://github.com/imputnet/helium), with an early visual prototype to validate the Nocturne experience before the full engine integration.

> **Project status:** foundation and design planning. This repository does not yet contain a browser, Chromium source, a runnable application, or a release build.

## Product principles

- **Private by default.** No mandatory account, no telemetry by default, and no background dependency on Google services. Crash reporting and any future metrics are opt-in.
- **Rooms, not piles.** Work is organized into Spaces with separate browsing data, tabs, permissions, and visual moods.
- **Real Chromium.** Version 1 targets Chromium compatibility rather than a new rendering engine.
- **Quiet by design.** The interface is sidebar-first, matte, restrained, and painterly. The web page remains the brightest object on screen.
- **Honest and accessible.** Safe defaults, visible privacy controls, keyboard access, reduced motion, and an RTL-ready layout.

## Target platforms

| Platform | First-release target | Minimum OS version |
|---|---:|---|
| Windows | Yes | To be established in the source/build audit |
| Linux | Yes | Distribution and baseline to be established in the source/build audit |
| macOS | Yes | Minimum version to be established in the source/build audit |

The project will use one cross-platform Chromium-based foundation. It will not start with three unrelated native browser shells. The exact shell/UI framework remains an audit decision; the visual prototype is intended to be independently reviewable before it is integrated into Chromium.

## Initial architecture

The architecture is divided into six layers. Each layer depends only on the layer below it:

1. **L0 — Engine:** Chromium built using the selected Helium patch/tooling baseline.
2. **L1 — Privacy and hardening:** de-Googling, content blocking, filter lists, privacy flags, and opt-in crash reporting.
3. **L2 — Browser core:** Spaces, storage isolation, omnibox logic, URL rules, and tab lifecycle.
4. **L3 — Shell and interface:** sidebar, tabs, folders, split view, Peek, command bar, and the Nocturne design system.
5. **L4 — Features and services:** importers, updates, command actions, and later optional services.
6. **L5 — Internal pages:** start page, settings, Insights, and onboarding.

See [docs/architecture.md](docs/architecture.md) and [the accepted platform decision](docs/decisions/0001-platforms-and-build-direction.md).

## The five Space moods

| Mood | Intended use | Character |
|---|---|---|
| Atelier | Work | Warm umber, olive-brown, restrained ember focus |
| Gambit | Research | Near-black and parchment, deliberate contrast |
| Vigil | Private | Almost monochrome, minimal grain, no warm glow |
| Drift | Media and leisure | Deep slate-blue with a cold wind accent |
| Ember | Home and saved things | Brown-black with one warm amber focus |

The supplied paintings are a private moodboard only. They must not be redistributed, bundled, used as wallpapers, or used in marketing without the artists' permission. Shipped artwork must be original or separately licensed.

## Version 1 boundaries

The current planning baseline excludes a new rendering engine, mandatory AI, vendor-operated cloud sync, and a second engine such as WebKit. Optional local-first AI, user-owned sync, and mobile are later considerations, not first-release commitments.

## Development sequence

1. Complete the repository and governance foundation.
2. Audit and pin upstream sources, licenses, build requirements, and reusable behavior.
3. Build and review the standalone Nocturne visual prototype.
4. Establish the repeatable Helium-based Chromium build.
5. Implement the shell, Spaces, privacy, import, and productivity features in measured increments.
6. Validate accessibility, RTL, security updates, stability, and performance before beta.

The detailed work breakdown and exit criteria are in [docs/implementation-plan.md](docs/implementation-plan.md). Phase 0 tracking is in [docs/phase-0-checklist.md](docs/phase-0-checklist.md).

## Repository map

```text
.github/workflows/       Foundation validation workflow
docs/decisions/          Accepted and pending architecture decisions
docs/design/             Visual-system and prototype specification
docs/third-party/        Source audit and provenance records
scripts/                 Repository validation scripts
LICENSE                  GNU GPL v3.0
NOTICE                   Project and third-party notice policy
CONTRIBUTING.md          Contribution and maintenance rules
SECURITY.md              Vulnerability reporting guidance
```

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before proposing changes. Every copied or adapted upstream file must have a provenance entry and preserve its original notices. Do not copy upstream names, logos, product screenshots, proprietary binaries, or the reference paintings.

## License

The project baseline is **GNU General Public License v3.0 only**. See [LICENSE](LICENSE) and [docs/decisions/0002-license-and-third-party-material.md](docs/decisions/0002-license-and-third-party-material.md). This is a practical project policy, not legal advice; review every dependency and file-level notice before distribution.
