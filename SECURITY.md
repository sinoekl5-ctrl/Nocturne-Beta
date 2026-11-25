# Security policy

Nocturne is not yet a released browser. Security-sensitive design decisions must be treated as release blockers, not deferred as ordinary polish.

## Reporting a vulnerability

Please do not publish details of an exploitable vulnerability in a public issue. Use GitHub's **Report a vulnerability** / private vulnerability reporting feature for this repository when it is enabled. If private reporting is not available, contact the repository owner privately through a verified GitHub channel and provide only the minimum details needed to establish a secure response path.

Do not send passwords, session cookies, private browsing data, or other users' personal information in a report.

## Security priorities

- Separate Space storage and Private Space lifecycle must be tested for cross-session and cross-Space leakage.
- Chromium and patch-set revisions must be pinned and updated through a documented security process.
- No telemetry is enabled by default; crash reporting is opt-in and must exclude URLs and page contents.
- Credentials must not enter logs, crash reports, local assistant context, or diagnostics without explicit and narrowly scoped user consent.
- Third-party dependencies and bundled components must be inventoried with their licenses and update owners.

A response-time commitment will be published once a maintained release channel and security-response owner are established.
