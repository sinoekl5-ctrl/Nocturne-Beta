#!/usr/bin/env python3
"""Validate the documentation-only Nocturne Phase 0 foundation."""
from __future__ import annotations

import csv
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = (
    "README.md", "LICENSE", "NOTICE", "CONTRIBUTING.md", "SECURITY.md",
    "docs/architecture.md", "docs/implementation-plan.md", "docs/phase-0-checklist.md",
    "docs/decisions/0001-platforms-and-build-direction.md",
    "docs/decisions/0002-license-and-third-party-material.md",
    "docs/design/visual-prototype.md", "docs/third-party/README.md",
    "docs/third-party/provenance.csv",
)
CSV_HEADER = (
    "local_path", "upstream_project", "upstream_repository", "upstream_commit",
    "upstream_path", "original_license", "change_type", "notice_preserved",
    "reviewed_by", "review_date", "notes",
)


def main() -> int:
    errors = []
    for relative in REQUIRED:
        path = ROOT / relative
        if not path.is_file() or path.stat().st_size == 0:
            errors.append(f"Missing or empty: {relative}")

    license_path = ROOT / "LICENSE"
    if license_path.is_file():
        license_text = license_path.read_text(encoding="utf-8", errors="replace")
        if "GNU GENERAL PUBLIC LICENSE" not in license_text or "Version 3" not in license_text:
            errors.append("LICENSE does not contain GNU GPL version 3 text")

    provenance = ROOT / "docs/third-party/provenance.csv"
    if provenance.is_file():
        with provenance.open(newline="", encoding="utf-8") as handle:
            header = next(csv.reader(handle), [])
        if tuple(header) != CSV_HEADER:
            errors.append("Provenance CSV header does not match the expected schema")

    readme = ROOT / "README.md"
    if readme.is_file():
        body = readme.read_text(encoding="utf-8")
        if "does not yet contain a browser" not in body:
            errors.append("README must disclose that this is not yet a runnable browser")
        for platform in ("Windows", "Linux", "macOS"):
            if platform not in body:
                errors.append(f"README missing platform target: {platform}")

    if errors:
        print("Foundation validation failed:", file=sys.stderr)
        for error in errors:
            print(f" - {error}", file=sys.stderr)
        return 1
    print(f"Foundation validation passed ({len(REQUIRED)} files checked).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
