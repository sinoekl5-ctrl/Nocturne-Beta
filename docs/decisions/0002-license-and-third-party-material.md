# ADR 0002: Project license and third-party material policy

- **Status:** Accepted as the working project baseline; legal review required before distribution
- **Date:** 2026-11-25
- **Decision owners:** Nocturne maintainer

## Context

The project brief recommends Helium's patch-based Chromium foundation. The current public Helium repository declares GNU GPL version 3.0 for its own work. The brief also records mixed licensing across the candidate sources, including imported patches and file-level notices.

## Decision

1. The working license for this project is **GNU GPL version 3.0 only** (`GPL-3.0-only`), represented by the root `LICENSE` file.
2. Every imported or adapted file must retain its applicable copyright and license notices. The project must not assume that a repository-level license overrides file-level or bundled-component terms.
3. Every borrowed implementation file, patch, asset, or materially adapted component must be recorded in `docs/third-party/provenance.csv`, including the exact upstream commit and original path/license.
4. Create and maintain a software bill of materials before producing distributable builds.
5. Nocturne will not depend on or redistribute Phi's proprietary Chromium framework.
6. The five painting references are private moodboard material only. Shipped artwork must be commissioned or separately licensed in writing.
7. No upstream project name, logo, icon, product screenshot, or marketing copy may be reused as Nocturne branding.

## Initial source-license notes from the project brief

These are audit leads, not legal conclusions. Re-verify the exact license and notices for each file at the pinned commit before reuse.

| Candidate | Brief's license summary | Nocturne treatment |
|---|---|---|
| Helium | GPL-3.0 for Helium's work; imported components may retain their own licenses | Candidate engine/privacy base; audit each patch and imported component |
| Ardia | GPL-3.0 as distributed; some original files Apache-2.0 | Reimplement behavior or reuse only after file-level audit |
| Crest | MPL-2.0 | Prefer behavior/specification; review file-level obligations before copying |
| Phi | Apache-2.0 client; proprietary Chromium framework excluded | Use architecture ideas only; no framework dependency |
| urlshortener-ui | MIT | UI patterns may be adapted while retaining required notices |

## Consequences

- This repository includes the full GPL v3 license text.
- Legal review is required before public binary distribution, especially for combined works, bundled dependencies, and file-level exceptions.
- No third-party implementation code is included in this initial foundation commit.
