# Contributing to Nocturne

Nocturne is in its foundation stage. Keep the project small, reproducible, cross-platform, and
legally traceable.

## Before changing code
1. Read the README, architecture, implementation plan, and relevant decision records.
2. For changes to platform scope, engine, licensing, data isolation, or v1 scope, update or add an
   architecture decision record before implementation.
3. Do not import upstream code until its exact commit, path, license, and file notices are reviewed
   and entered in docs/third-party/provenance.csv.
4. Do not add upstream names/logos, copied product screenshots, proprietary binaries, or the
   supplied reference paintings.

## Engineering expectations
- Keep Nocturne-specific Chromium patches isolated from upstream patch sets.
- Pin Chromium, patches, toolchains, and dependencies once the build is established.
- Prefer small changes with a focused test and a short rationale.
- No telemetry by default. Diagnostics must not collect URLs, browsing history, credentials, or
  page contents.
- Treat Windows, Linux, macOS, keyboard access, reduced motion, and RTL as first-class test cases.

## Commit messages
Use short imperative subjects and prefixes such as docs:, build:, feat:, fix:, privacy:, a11y:, chore:.

## Pull requests
Explain user-visible behavior or engineering rationale, affected platforms, tests, and license or
provenance impact. Prototype screenshots must not contain protected reference paintings or
unlicensed third-party assets.
