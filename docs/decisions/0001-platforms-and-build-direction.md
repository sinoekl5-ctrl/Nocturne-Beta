# ADR 0001: Platform targets and build direction

- Status: Accepted
- Date: 2026-11-25

## Context
The project brief compares a Helium-based Chromium fork, native shells around embedded Chromium,
and a short-lived theme prototype. The maintainer selected a cross-platform Chromium foundation
with an early visual prototype.

## Decision
1. First-release targets: Windows, Linux, and macOS.
2. Pursue the cross-platform Chromium-fork approach (Approach A in the brief), with Helium's
   patch-based Chromium build as the primary candidate foundation.
3. Build and review the Nocturne visual prototype early, independently of the full Chromium build.
4. Aim for one cross-platform shell/interface architecture, not three unrelated native shells.
5. Pin upstream revisions, minimum OS versions, exact UI framework, build hosts, and patch-rebase
   policy during the source/build audit. This ADR does not pin an upstream revision.

## Consequences
Chromium patch maintenance and security rebasing are permanent responsibilities. Platform-specific
integration must sit behind narrow adapters. Nocturne is not "cross-platform" for release purposes
until installable builds and smoke tests pass on all three target operating systems. The visual
prototype is not proof of browser-engine integration.

## Revisit when
The Helium/Chromium audit finds a blocking platform, licensing, or maintenance constraint. Record
any change in a new ADR.
