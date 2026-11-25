# Engine build readiness

## Verified source identity

The pinned upstream trees were inspected on 25 November 2026. The three platform package commits all point their `helium-chromium` gitlink at the same Helium root commit. The Helium root's `chromium_version.txt` declares Chromium `158.0.8127.88`.

| Component | Immutable commit |
|---|---|
| Helium shared root | `41a32da3ed31e0c4a550b7f317f5ab095deee1c9` |
| Helium macOS packaging | `0b5bf1274dfce6aa8163060d9a7172fd7bac409b` |
| Helium Linux packaging | `4c8b8256a29290d57a5dd279c4228e770cf3904e` |
| Helium Windows packaging | `4f7143df92fd0c29ce50c4856523bb8390bf6753` |
| Chromium version declared by Helium | `158.0.8127.88` |

Machine-readable record: [engine-set.json](third-party/engine-set.json). CI validates the lock against the upstream pin ledger and performs real Git checkout/submodule SHA checks for each platform package.

## Reproduce the source checkout

The checkout helper does not build Chromium or install tools. It clones the selected packaging repository at its immutable commit, initializes recursive submodules, and verifies both the package HEAD and the Helium submodule:

```sh
python scripts/engine/checkout.py --platform Linux --workspace /path/to/nocturne-engine
```

Use `macOS` or `Windows` for those package repos. The default workspace is `~/.cache/nocturne/engine`. The helper refuses to overwrite an existing unverified directory; remove or rename a failed checkout yourself after inspecting it.

## Verification boundary

**Source pins and Git checkout are verified; native builds are not.** This lock does not establish that Chromium compiles, that the host meets upstream requirements, or that an installer launches. No Chromium build or native packaging has been completed in this audit environment.

Do not combine Ardia's separately documented Chromium `158.0.8127.36` / Helium `0.22.2` build combination with this pin set. It is a different upstream combination.

## Native build work required

- **macOS:** build using the pinned macOS packaging repository, its pinned Helium submodule, and the documented Xcode/Metal toolchain. Run upstream setup, build, run and validation commands on a supported Mac.
- **Linux:** use the pinned Linux packaging repository and matching submodule. Record distribution, kernel/display stack, CPU, RAM, disk, elapsed time and output hashes. Do not claim Flatpak support while the upstream sandbox issue is unresolved.
- **Windows:** use the pinned Windows packaging repository and matching submodule with the documented Visual Studio/Windows SDK toolchain. Run build and launch smoke tests on Windows 11 hardware or a clearly identified VM.

For each platform, preserve checked-out SHAs, Chromium version, OS/toolchain versions, command transcript, elapsed time, exit status, artifact SHA-256 and launch/smoke-test results. A successful compile alone is not release readiness.

## Next gate

1. Complete the source-only pinned checkout in CI for all three package repositories.
2. Run upstream setup/build/run/validation on available supported native runners.
3. Record reproducible build evidence or specific blockers for all three platforms.
4. Only then begin the Nocturne-owned `chrome://nocturne/` WebUI spike and typed native bridge.
5. Keep Nocturne patches separate from Helium's upstream series and preserve third-party notices.

Upstream references: [Helium shared repository](https://github.com/imputnet/helium), [macOS build guide](https://github.com/imputnet/helium-macos/blob/main/docs/building.md), [Linux packaging](https://github.com/imputnet/helium-linux), [Windows packaging](https://github.com/imputnet/helium-windows).
