# ADR 0002: License and third-party material policy

- Status: Working baseline; legal review required before distribution
- Date: 2026-11-25

## Decision
1. Working project license: GNU GPL version 3.0 only (GPL-3.0-only), included in LICENSE.
2. Preserve every imported file's copyright and license notices; repository-level licensing does
   not erase file-level or bundled-component terms.
3. Record every borrowed/adapted file, patch, component, or asset in
   docs/third-party/provenance.csv with immutable upstream commit, original path, and license.
4. Produce and maintain an SBOM before distributable builds.
5. Do not depend on or redistribute Phi's proprietary Chromium framework.
6. Treat the five paintings as private moodboard material only. Commission or separately license
   all shipped artwork.
7. Do not reuse upstream names, logos, icons, screenshots, or marketing copy as Nocturne branding.

## Audit leads from the project brief
Helium: GPL-3.0 for its own work; imported pieces may retain other licenses.
Ardia: GPL-3.0 as distributed, with some Apache-2.0 source files.
Crest: MPL-2.0 with file-level obligations.
Phi: Apache-2.0 client source, proprietary engine framework excluded.
urlshortener-ui: MIT; preserve its notice if adapting code.

These are audit leads, not legal conclusions. Recheck exact files/notices at pinned commits and
obtain legal review before distributing binaries or combined works.
