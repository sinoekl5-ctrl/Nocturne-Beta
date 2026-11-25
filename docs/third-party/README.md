# Third-party source audit and provenance

The candidate repositories are research inputs, not blanket permission to copy source or assets. The immutable `main` commit snapshot for 25 November 2026 is recorded in `upstream-pins.csv`. The detailed analysis is in `docs/audits/2026-11-25-source-audit.md`.

| Project | Repository | Study/use |
|---|---|---|
| Helium | https://github.com/imputnet/helium | Candidate Chromium patches, privacy configuration, build tooling |
| Phi | https://github.com/phibrowser/phibrowser-mac | Architecture/safety ideas only; exclude proprietary engine framework |
| Crest | https://github.com/crest-browser/Crest | Space model, behavior specs and architecture docs |
| Ardia | https://github.com/ardia-browser/ardia | Sidebar, command-bar behavior, Linux/Windows Chromium-hosted UI evidence, importers |
| urlshortener-ui | https://github.com/igorsyrbu/urlshortener-ui | Minimal internal-page and URL-cleaner patterns |

Supporting Helium platform packaging repositories (`helium-macos`, `helium-linux`, `helium-windows`) are also pinned because their release/build tooling is separate from the Helium patch repository. Their helium-chromium gitlinks are verified against the same root commit and Chromium version in [helium-engine-baseline.md](helium-engine-baseline.md); the check is part of scripts/validate_foundation.py.

Add one row per reused/adapted file to `provenance.csv`. Use immutable commit hashes, not moving branches. Preserve every original notice and license. Never include source paintings or assets whose rights are unclear. Build an SBOM from the exact checkout before distributable binaries.
