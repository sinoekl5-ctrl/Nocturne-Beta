# Verified Helium cross-platform engine baseline

- **Snapshot date:** 2026-11-25
- **Status:** source-level pin alignment verified; native builds not yet reproduced.
- **Decision:** use one Helium Chromium patch root across all three packaging repositories. Do not mix the Ardia engine pin into this baseline.

## Immutable source pins

| Component | Repository | Commit |
|---|---|---|
| Helium Chromium patch/tooling root | [imputnet/helium](https://github.com/imputnet/helium/tree/41a32da3ed31e0c4a550b7f317f5ab095deee1c9) | 41a32da3ed31e0c4a550b7f317f5ab095deee1c9 |
| Chromium version at Helium root | chromium_version.txt | 158.0.8127.88 |
| macOS packaging | [imputnet/helium-macos](https://github.com/imputnet/helium-macos/tree/0b5bf1274dfce6aa8163060d9a7172fd7bac409b) | 0b5bf1274dfce6aa8163060d9a7172fd7bac409b |
| Linux packaging | [imputnet/helium-linux](https://github.com/imputnet/helium-linux/tree/4c8b8256a29290d57a5dd279c4228e770cf3904e) | 4c8b8256a29290d57a5dd279c4228e770cf3904e |
| Windows packaging | [imputnet/helium-windows](https://github.com/imputnet/helium-windows/tree/4f7143df92fd0c29ce50c4856523bb8390bf6753) | 4f7143df92fd0c29ce50c4856523bb8390bf6753 |

At each pinned platform-package commit, the helium-chromium Git submodule points to the exact Helium root commit 41a32da3ed31e0c4a550b7f317f5ab095deee1c9. The root's chromium_version.txt reports 158.0.8127.88. The repository validator now checks the recorded gitlink and Chromium-version relationship in docs/third-party/upstream-pins.csv.

## Build prerequisites recorded upstream

| Platform | Prerequisites and workflow observed at the pinned refs |
|---|---|
| macOS | The pinned build guide calls for macOS 12+, Xcode 26, the Metal toolchain, and Homebrew dependencies (or the provided Nix development shell). It produces a .dmg. |
| Linux | The pinned packaging repository uses scripts/docker-build.sh, Docker Buildx, and a Debian Trixie-based chromium-builder image. Its packaging flow can produce tarball/AppImage and optionally .deb. |
| Windows | The pinned guide describes Windows 11 setup, Visual Studio, Python, Git and supporting tools. The x64 path defaults to prepared Chromium archives; ARM64 uses the clone path. |

These are upstream build-tool instructions at the recorded commits, not Nocturne's final minimum-support policy. The minimum supported Windows/macOS versions and Linux distribution/package matrix remain open decisions.

## What is verified — and what is not

**Verified:** each platform packaging repository references the same immutable Helium patch/tooling commit, and that root commit identifies Chromium 158.0.8127.88. This avoids combining the Helium 158.0.8127.88 root with Ardia's separately documented Chromium 158.0.8127.36 / Helium 0.22.2 build.

**Not verified:** a fresh checkout has not yet compiled or launched on any native platform; the patch set has not been proven reproducible in Nocturne's own build environment; no installable Nocturne browser artifact exists; the WebUI bridge and profile isolation are not implemented.

## Next build gate

1. Provision platform-native build hosts that satisfy the pinned upstream tool requirements and have sufficient disk, memory, CPU and artifact cache.
2. Reproduce one clean build per platform from the recorded source set; save build logs, toolchain versions and artifact hashes.
3. Launch each result and run smoke checks for real HTTPS navigation, downloads, extension policy and process startup.
4. Only after engine smoke tests pass, implement the first chrome://nocturne/ WebUI vertical slice with a typed, origin-checked native bridge.
5. Generate the SBOM and finish file-level license/provenance review before redistributable artifacts.

Do not describe the source-pin alignment check as a successful Chromium build.
