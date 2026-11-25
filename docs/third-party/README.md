# Third-party source audit and provenance

The candidate repositories are research inputs, not blanket permission to copy source/assets.
Phase 1 must inspect exact immutable commits, paths, repository and file-level notices, dependencies,
and build requirements.

| Project | Repository | Study/use |
|---|---|---|
| Helium | https://github.com/imputnet/helium | Candidate Chromium patches, privacy configuration, tooling |
| Phi | https://github.com/phibrowser/phibrowser-mac | Architecture/safety ideas only; exclude proprietary engine |
| Crest | https://github.com/crest-browser/Crest | Space model, behavior specs, architecture docs |
| Ardia | https://github.com/ardia-browser/ardia | Sidebar, command-bar behavior, importers, portable logic |
| urlshortener-ui | https://github.com/igorsyrbu/urlshortener-ui | Minimal internal-page and URL-cleaner patterns |

urlshortener-ui is a URL-shortener dashboard, not a browser; it remains because it is the fifth
source named in the project brief.

Add one row per reused/adapted file to provenance.csv. Use immutable commit hashes rather than
moving branches. Record original licenses and preserve all file notices. Do not import an asset
whose rights are unclear. Build an SBOM before creating distributable binaries.
