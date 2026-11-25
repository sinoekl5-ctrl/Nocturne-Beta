# Contributing to Nocturne

Nocturne is in its foundation stage. Contributions should keep the project small,
reproducible, legally traceable, and cross-platform.

## Before opening a change

1. Read the README, architecture document, implementation plan, and relevant decision records.
2. For a change that alters platform scope, engine choice, licensing, data isolation, or first-release scope, open or update a decision record before implementation.
3. Do not import upstream code until its exact source commit, path, license, and notices have been reviewed and entered in `docs/third-party/provenance.csv`.
4. Do not add the reference paintings, upstream logos, product icons, proprietary binaries, or copied product screenshots.

## Change expectations

- Keep Nocturne-specific Chromium patches isolated from the upstream patch series.
- Pin toolchains, Chromium revisions, patch-set revisions, and dependencies once the build is established.
- Prefer small, reviewable changes with focused tests and a short rationale.
- Avoid telemetry and network calls that are not required for the user's requested action.
- Never include URLs, browsing history, credentials, or page contents in diagnostic reporting.
- Treat Windows, Linux, macOS, keyboard-only operation, reduced motion, and RTL layout as first-class test cases as their implementation lands.

## Commit messages

Use a short imperative subject. Suggested prefixes are `docs:`, `build:`, `feat:`, `fix:`, `privacy:`, `a11y:`, and `chore:`. Keep unrelated changes in separate commits.

## Pull requests

A pull request should explain the user-visible behavior or engineering reason, identify affected platforms, include tests or a clear reason tests are not applicable, and list any license/provenance impact. Screenshots of the visual prototype are welcome, but must not contain copyrighted reference paintings or third-party product assets without permission.

## Local prototype checks

From the repository root, run `npm test` and `python scripts/validate_foundation.py`. Start the visual study with `npm run dev`. The prototype intentionally has no runtime dependencies. Do not connect network navigation or privileged Chromium bridge calls to it without a separate security design/review.
