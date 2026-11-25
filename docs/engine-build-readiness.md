# Engine build readiness and reproduction gate

**Status: source pins audited; native builds not reproduced.** This document records the build entry points at the currently pinned Helium/platform commits and the limits of the audit environment. It is not a build report and does not certify a supported platform.

## Nocturne's current source baseline

The upstream pin ledger records these immutable revisions:

| Component | Commit | Observed engine revision |
|---|---|---|
| Helium root | `41a32da3ed31e0c4a550b7f317f5ab095deee1c9` | Chromium `158.0.8127.88` |
| Helium macOS packaging | `0b5bf1274dfce6aa8163060d9a7172fd7bac409b` | Must be validated against the root pin |
| Helium Linux packaging | `4c8b8256a29290d57a5dd279c4228e770cf3904e` | Must be validated against the root pin |
| Helium Windows packaging | `4f7143df92fd0c29ce50c4856523bb8390bf6753` | Must be validated against the root pin |

These are source snapshots, not proof that the combination builds. In particular, do not substitute Ardia's documented Chromium `158.0.8127.36` / Helium `0.22.2` recipe for Nocturne's current Helium root without deliberately selecting and verifying a compatible set.

## Upstream build entry points at the pinned commits

- **Linux:** the pinned `helium-linux` README says to run `scripts/docker-build.sh`. The script builds a Debian Trixie-based Docker image and invokes its build entry point. The repository also notes that official packages are limited to its documented formats; Flatpak is not supported due to Chromium sandbox concerns.
- **macOS:** the pinned `helium-macos` `docs/building.md` specifies macOS 12+, Xcode 26, Homebrew and the Metal toolchain, plus Python dependencies. Its official build entry point is `./build.sh`; development uses `source dev.sh`, `he setup`, `he build`, and `he run`. Signing/notarization is separate and requires Apple credentials.
- **Windows:** the pinned `helium-windows` README describes setup on Windows 11 and a Dev Drive. The release recipe is `python build.py` followed by `python package.py`; development uses `. .\\dev.ps1`, `he setup`, `he build`, and `he run`.

The commands above are upstream entry points. No Nocturne branding patch, Nocturne native shell, or cross-platform Nocturne artifact has been built by this repository yet.

## Current audit sandbox: measured blocker

At the time this check was run, the remote workspace reported:

| Resource | Available |
|---|---:|
| CPU | 1 vCPU |
| RAM | 976 MiB total |
| Root filesystem | 25 GiB total, about 21 GiB free |
| Swap | 0 |
| Installed build tools | `git`, `python3` |
| Missing | `clang`, `gn`, `autoninja`, `gclient`, `depot_tools` |

Chromium's [official Linux build instructions](https://chromium.googlesource.com/chromium/src/+/main/docs/linux/build_instructions.md) currently list x86-64, at least 8 GB RAM (more than 16 GB recommended), and at least 100 GB free disk as system requirements. This sandbox is well below that baseline, so a full Chromium checkout/build is not a responsible or viable attempt here. **No native build was attempted**, and this measurement does not mean the upstream build itself failed.

## Reproduction record required to close Phase 1

For each target OS, record:

1. OS version, architecture, CPU/thread count, RAM, free disk and build-host type.
2. Exact Helium root commit, platform-packaging commit and Chromium version.
3. The exact upstream command and any Nocturne patch series applied.
4. Checkout, dependency/setup, compile and package outcomes with elapsed time and failure logs.
5. SHA-256 of the produced artifact and a launch/navigation smoke-test result.

Keep the Windows, Linux and macOS rows open until each native build launches and passes the smoke test. A source-pin validator, SBOM generator, prototype test, or CI documentation check cannot substitute for this gate.

## Source references

- [Pinned Helium root README](https://github.com/imputnet/helium/tree/41a32da3ed31e0c4a550b7f317f5ab095deee1c9)
- [Pinned macOS build instructions](https://github.com/imputnet/helium-macos/blob/0b5bf1274dfce6aa8163060d9a7172fd7bac409b/docs/building.md)
- [Pinned Linux build script](https://github.com/imputnet/helium-linux/blob/4c8b8256a29290d57a5dd279c4228e770cf3904e/scripts/docker-build.sh)
- [Pinned Windows build README](https://github.com/imputnet/helium-windows/tree/4f7143df92fd0c29ce50c4856523bb8390bf6753)
