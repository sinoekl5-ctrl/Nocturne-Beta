# Native Helium/Chromium build runbook

## Scope and truth boundary

This builds the **pinned upstream Helium browser** as the engine baseline. It does not yet rebrand the executable as Nocturne, add the Nocturne shell, or prove Spaces isolation. A successful compile is not the Alpha 0 exit criterion: launch a clean profile, navigate to a real HTTPS site, and record the evidence.

The lock identifies Helium `41a32da3ed31e0c4a550b7f317f5ab095deee1c9`, Chromium `158.0.8127.88`, and platform packaging commits in [engine-set.json](third-party/engine-set.json). The source helper verifies immutable package and submodule SHAs:

```sh
python scripts/engine/checkout.py --platform Linux --workspace /absolute/path/nocturne-engine
```

Replace `Linux` with `macOS` or `Windows`. Use a native machine with substantial RAM and free disk; Chromium builds may take hours. Do not run a full build on a short-lived general-purpose CI runner.

## Linux

Use a supported Debian-based x86_64 or arm64 host with Docker Buildx. The pinned Helium Linux repository provides its own Docker build environment; use it rather than invoking the inner build script on an arbitrary distribution.

```sh
cd /absolute/path/nocturne-engine/linux
scripts/docker-build.sh
scripts/package.sh
```

Expected outputs are under `build/release/` (AppImage and `.tar.xz`). Do not claim Flatpak support: upstream documents a Chromium sandbox packaging issue and does not support Flatpak. Record host distribution, Docker version, architecture and sandbox behavior.

## Windows

Use Windows 11 with Visual Studio components and Windows SDK required by the pinned checkout. Prefer a Dev Drive; enable long-path support for Python build scripts. Run from an elevated Developer PowerShell/Command Prompt as required by upstream:

```powershell
cd C:\path\to\nocturne-engine\windows
python build.py
python package.py
```

The upstream `build` directory should contain the archive/installer. Record exact Visual Studio, MSVC, Windows SDK and Python versions. Inspect the package before performing a documented interactive install and smoke test.

## macOS

Use macOS 12+ with Xcode 26 and Metal toolchain. Upstream dependencies include Homebrew `python@3.13`, `wget`, `zstd`, `coreutils`, `readline`, Python `requests` and `pillow`, and Perl for `.dmg` packaging. Upstream advises unlinking Homebrew binutils so Xcode's toolchain is used.

```zsh
cd /absolute/path/nocturne-engine/macos
./build.sh
```

Expected output is a `.dmg` under `build/`. Signing/notarization credentials are not required for an unsigned local verification build; do not add Apple credentials to repository secrets for this initial run.

## Optional GitHub Actions execution

The repository now has a **manual-only** `Native engine build (manual, self-hosted)` workflow. It never runs on pushes or pull requests. To use it, register one self-hosted runner per platform with the labels used in the workflow (`nocturne-engine` plus the OS/architecture labels), provision the upstream toolchains and required free disk, and dispatch the workflow for that runner's platform. The runner must be trusted and dedicated to this repository; the workflow executes upstream build scripts and can consume substantial disk, memory and time. It uploads build logs, selected package outputs and a `built-not-smoke-tested` JSON record for seven days. The record includes source SHAs, host/toolchain metadata and package hashes. It does not install the browser or mark a build record succeeded automatically; complete the clean-profile runtime smoke test and evidence record separately.

## Required evidence

For each platform:

1. Save complete setup/build/package command transcripts and exit codes.
2. Capture host OS/build, architecture, CPU/core count, RAM, free disk before build, filesystem and toolchain versions.
3. Verify package and Helium submodule SHAs against the lock.
4. Record elapsed time, warnings/errors and output artifact SHA-256 values.
5. On a clean test profile, verify first-run launch, real HTTPS navigation, page rendering and no startup crash. Record the test log; do not include personal profile data.
6. The manual GitHub workflow captures a `built-not-smoke-tested` record with the source SHAs, host metadata and artifact hashes. For a local run, use `scripts/engine/capture_build_record.py` with the same `--platform`, `--workspace`, repeated `--artifact`, `--build-log`, `--build-command`, `--elapsed-seconds`, `--free-disk-before` and `--output` arguments. This record proves build/package completion only; it intentionally leaves runtime smoke fields unset.
7. After the clean-profile smoke test, update the captured record's runtime and reviewer fields and set `status` to `succeeded`. Use `blocked` or `failed` with explicit `runtime_smoke.known_blockers` when appropriate. Never mark success based on source checkout or compilation alone.

Validate a successful record:

```sh
python scripts/validate_engine_build_record.py path/to/linux-build-record.json --require-success
```

The validator checks the record against the source lock and requires build, artifact hash, launch, first-run, navigation and reviewer evidence. It does not execute or certify the build itself.

## Next project gate

Do not start the privileged `chrome://nocturne/` bridge until a pinned native build can launch and navigate. Then create the smallest upstream patch to replace product identity and register the Nocturne WebUI origin, with strict browser-process origin/frame validation and an allow-listed typed message contract. Keep that patch separate from Helium's patch series and preserve third-party notices.
