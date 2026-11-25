# Phase 0 checklist

## Completed in the foundation
- [x] Record Windows, Linux, and macOS as first-release targets.
- [x] Record the cross-platform Chromium and early visual prototype direction.
- [x] Add README, project structure, GPL v3 license, NOTICE, and third-party policy.
- [x] Add provenance template, architecture and visual prototype specification.
- [x] Add contribution/security guidance, implementation plan, and foundation CI.
- [x] Keep unlicensed reference artwork and third-party implementation code out.

## Still required to close Phase 0
- [ ] Decide maintainer/team model and review process.
- [ ] Conduct trademark/domain review for Nocturne; no clearance is implied.
- [ ] Select minimum Windows/macOS versions and initial Linux distribution/packaging matrix.
- [ ] Confirm Chromium build workstation or CI runner, disk/RAM, and caching strategy.
- [ ] Confirm whether the five-source list is final; urlshortener-ui is a URL-shortener dashboard,
      not a browser.
- [ ] Confirm first-run mood (brief proposes Atelier).
- [ ] Confirm Arabic/RTL release gate; architecture remains RTL-aware regardless.
- [ ] Complete legal review of GPL-3.0-only and all mixed upstream/file-level licensing before
      distributing builds.

## Verification boundary
Foundation CI checks documentation, required files, license text, and provenance template only. It
does not build Chromium or a browser. Product build workflows follow the Phase 1 source/build audit.
