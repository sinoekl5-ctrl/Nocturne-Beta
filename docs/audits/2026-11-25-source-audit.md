# Nocturne source and platform audit — 2026-11-25

- Audit date: 2026-11-25 UTC
- Scope: public default-branch repository metadata, immutable `main` commit refs, repository READMEs/licenses, and the named architecture/build documents listed below.
- Status: **repository/document audit complete; reproducible engine builds not yet demonstrated.**
- This report records a snapshot. Upstream `main` branches move; use the pinned SHAs in `../third-party/upstream-pins.csv` for repeatable follow-up.

## Executive result

**Keep Helium as the engine/patch foundation candidate. Build a new Nocturne shell as a Chromium-hosted WebUI, with a narrow native bridge and platform adapters. Use Ardia as the strongest current reference for a Chromium-hosted desktop shell and shared UI; use Crest primarily for Space behavior specifications; use Phi only for optional future safety concepts; use urlshortener-ui only for small internal-page/URL-cleaner patterns.**

Do not merge the five source trees. They use incompatible languages, runtime models, and platform assumptions. Reimplement behavior where needed and copy code only after file-level review and a provenance entry.

## Current source matrix

| Candidate | Pinned `main` commit | Current repository fact | Nocturne treatment |
|---|---|---|---|
| [Helium](https://github.com/imputnet/helium) | `41a32da3ed31e0c4a550b7f317f5ab095deee1c9` | Chromium patch set and build tooling, not a complete Chromium source tree. `chromium_version.txt` at this commit is `158.0.8127.88`. The repository separates macOS, Linux, and Windows packaging/tooling. Its own work is GPL-3.0; imported items keep their original notices/licenses. | **Adopt as the engine/patch base candidate**, after all three platform build and license checks. Maintain a separate Nocturne patch series and app identity. |
| [Phi Browser for macOS](https://github.com/phibrowser/phibrowser-mac) | `8a4fcd21e14718a5b179d99aeb88c7a574180dba` | Native Swift/AppKit/SwiftUI app. Apache-2.0 applies to client source, but its build still requires `Phi Framework.framework`; the open-source build scheme prunes optional services but does not turn the framework into an open source engine. | **Specify only.** Study visible action logs, credential filtering and readable local memory as possible later design references. Do not depend on or redistribute its framework. |
| [Crest](https://github.com/crest-browser/Crest) | `b36496c6e5af334e76040f119fccec656d87b969` | Apple-native SwiftUI app with a documented Space boundary and a portable .NET core. Repository declares MPL-2.0 and includes a separate trademark policy. | **Specify/Port behavior.** Use Space lifecycle, isolation, archive, Peek and split-view behavior as requirements; do not copy files without MPL/file-level review or reuse Crest marks. |
| [Ardia](https://github.com/ardia-browser/ardia) | `55f041374a10605be46fbbe6aa935d557ee22b24` | Large active Chromium-based project. Its current docs describe a Linux Chromium-hosted `chrome://ardia/` shell, a Windows desktop/WebUI direction and shared browser UI. The current engine build docs use Chromium `158.0.8127.36` with Helium `0.22.2`, which is not the same pin as the audited Helium `main` commit above. Root licensing is GPL-3.0 as distributed with Apache-2.0 files/notices also present. | **Adopt behavior specifications; prototype a Chromium WebUI shell independently.** Review any prospective file individually. Do not import the entire React Native/native-host architecture. |
| [urlshortener-ui](https://github.com/igorsyrbu/urlshortener-ui) | `4a4daa10f346143487def11b57e3627d50d0196a` | Next.js URL-shortener dashboard with an Express mock server; it is not a browser and contains no rendering engine, browser navigation or tab system. MIT license. | **Specify/Port narrow patterns only:** restrained internal pages, tags, settings, local Insights and a user-controlled URL-cleaner setting. No account, billing or mock-backend code. |

## Platform evidence

### Helium

The main repository contains patches, flags, substitutions, pruning rules, build utilities and version pins; Chromium is fetched separately. The current main pin identifies Chromium `158.0.8127.88`. Separate upstream packaging projects exist and are pinned in the provenance/pin ledger:

- [helium-macos](https://github.com/imputnet/helium-macos), `0b5bf1274dfce6aa8163060d9a7172fd7bac409b` — macOS packaging and development tooling; its README recommends macOS as the primary development platform.
- [helium-linux](https://github.com/imputnet/helium-linux), `4c8b8256a29290d57a5dd279c4228e770cf3904e` — Linux package/build tooling; its README documents x86_64 and arm64 formats, Debian/Ubuntu and Fedora packages, AppImage/tarball, and explicitly declines Flatpak while it considers the Chromium sandbox problem unresolved.
- [helium-windows](https://github.com/imputnet/helium-windows), `4f7143df92fd0c29ce50c4856523bb8390bf6753` — Windows packaging and development tooling; its README documents Windows 11 setup, Visual Studio/toolchain provisioning, source/patch setup, build and packaging commands.

These are separate build systems, not one ready-made universal build command. The exact Helium main pin and platform package pins must be tested together before adopting them as a Nocturne release baseline.

### Ardia

Ardia is now more useful to cross-platform research than the November brief's earlier macOS-only summary suggests, but its docs must be read with their status qualifiers:

- The current Linux port document describes Chromium itself hosting the desktop UI at `chrome://ardia/`, with a C++ host and `window.__ardiaHost` bridge. It documents x86-64 Linux, with Wayland as the primary target, X11 working, and arm64 configured but untested in that document.
- The current Windows document describes a Windows WebUI host and desktop UI build. It also records Windows-specific unfinished behavior and some calls marked `NOT_ON_WINDOWS_YET`.
- Windows pull request [#1116](https://github.com/ardia-browser/ardia/pull/1116) is merged. Its initial Windows alpha was built for x64 and ARM64, had CI launch checks and a page tour, and was tried in a Windows 11 VM and GitHub Windows runners. The PR explicitly says it had not yet been tried on a real PC; it also lists unsigned installers and incomplete browser functions. Later `main` documentation describes a subsequent WebUI-shell direction. Treat Windows as an evolving upstream implementation, not as proof that a production-ready Nocturne Windows release already exists.
- The current cross-platform-core document describes a staged consolidation into a shared Rust core and two host families. That is an evolving architecture plan; it is not a reason to import the current core wholesale.

The Chromium version in Ardia's currently documented engine build (`158.0.8127.36`) differs from the version in the current audited Helium root commit (`158.0.8127.88`). Do not combine arbitrary Ardia patches, Helium packaging pins and a different Chromium checkout. Reproduce a coherent upstream combination first.

## License and branding controls

- Helium: GPL-3.0 for its own work; imported ungoogled-Chromium components retain their original licenses, including BSD-3-Clause material. Read and retain every upstream notice.
- Ardia: repository-level GPL-3.0 as distributed, with Apache-2.0 source files and bundled components carrying their own terms. Inspect every file; do not infer a single license for the whole tree.
- Crest: MPL-2.0 and a reserved-marks policy. A repository license is not permission to use its logo/name/identity.
- Phi: Apache-2.0 client source is separate from the proprietary engine framework requirement.
- urlshortener-ui: MIT; preserve the required copyright/license notice for any file actually adapted.
- The Nocturne root GPL-3.0 baseline is a project policy, not a substitute for file-level license review or legal advice.
- Do not ship the five moodboard paintings, source product logos, browser screenshots or copied marketing artwork. The prototype uses original CSS geometry only.

## First-pass Adopt / Port / Specify / Skip

| Feature | Decision | Reason / gate |
|---|---|---|
| Chromium + Helium patch tooling | Adopt candidate | The only candidate engine/patch base in the brief with documented three-platform packaging; confirm aligned pins/builds. |
| De-Googling, domain substitutions, flags | Adopt selectively | Preserve Helium notices and add explicit tests for every change. |
| Content blocking / uBlock Origin integration | Adopt candidate | Confirm upstream distribution license, component notices, extension behavior and filter update policy first. |
| Space isolation | Port | Map Crest's behavior to Chromium profiles/BrowserContexts; leakage tests are a release blocker. |
| Sidebar, command bar, tab folders | Port | Rebuild in a Nocturne-owned cross-platform WebUI rather than importing a platform-bound native shell. |
| Split view (2–3 panes), Peek, archive | Port | Behavior specifications from Crest/Ardia; implement and test in the chosen Nocturne host. |
| Tab sleeping / Keep Loaded | Specify then Port | Measure memory, restore correctness and exceptions for live pages before enabling. |
| Browser importers | Port selectively | Start with one or two formats after a data-loss and credential-handling review. |
| Safe local-first AI / agent action log | Specify only | V1 non-goal; Phi framework is excluded. |
| Vendor cloud sync / iCloud-only sync | Skip v1 | Cross-platform, no vendor cloud requirement; not in initial scope. |
| Second engine / WebKit | Skip v1 | Chromium only in v1. |
| urlshortener-ui account/billing/mock backend | Skip | No account or URL-shortener SaaS in v1. |

## What this audit did not prove

This was a GitHub metadata, pinned-tree, README, license, and selected architecture/build-document audit. It did **not** clone and compile Chromium, run the upstream applications, verify native installers on Windows/macOS/Linux hardware, or establish final minimum OS versions. Those are still required. A full Chromium checkout/build is materially larger than this documentation/prototype environment and requires platform-specific toolchains, disk/cache and native verification.

## Next engineering gate

1. Establish a reproducible Helium checkout at an immutable Chromium + patch + platform-package set.
2. Prove one Linux/macOS/Windows minimal build or obtain documented blockers for each; don't infer build success from package README alone.
3. Spike one minimal `chrome://nocturne/` WebUI with a typed, allow-listed native bridge and no arbitrary page-origin privilege.
4. Only after that spike should the UI framework, exact C++ adapter seams, minimum OS versions and build matrix be frozen.
5. Keep the standalone prototype as the visual acceptance reference; it is not the browser shell yet.
