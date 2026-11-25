# Security policy

Nocturne is not yet a released browser. Security-sensitive design decisions are release blockers.

## Reporting
Do not publish exploitable vulnerability details in a public issue. Use GitHub's private
vulnerability reporting feature when enabled. Otherwise contact the repository owner privately
through a verified GitHub channel. Do not include passwords, cookies, browsing history, or other
users' private information in a report.

## Security priorities
- Prove Space storage isolation and Private Space cleanup with automated leakage tests.
- Pin Chromium/patch-set revisions and maintain a documented security update process.
- No telemetry by default; crash reporting is opt-in and excludes URLs and page contents.
- Prevent credentials from entering logs, crash reports, or optional assistant context without
  explicit, narrowly scoped consent.
- Inventory third-party components, licenses, versions, and update owners.

A response-time commitment will be published after a maintained release channel and response owner
are established.
