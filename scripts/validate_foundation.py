#!/usr/bin/env python3
"""Validate Nocturne's documentation and prototype foundation."""
from __future__ import annotations

import csv
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REQUIRED_FILES = (
    "README.md", "LICENSE", "NOTICE", "CONTRIBUTING.md", "SECURITY.md",
    "package.json", "prototype/index.html", "prototype/styles.css", "prototype/app.js",
    "prototype/core.mjs", "scripts/serve.mjs", "tests/core.test.mjs",
    "docs/architecture.md", "docs/implementation-plan.md", "docs/phase-0-checklist.md",
    "docs/decisions/0001-platforms-and-build-direction.md",
    "docs/decisions/0002-license-and-third-party-material.md",
    "docs/decisions/0003-cross-platform-shell.md",
    "docs/design/visual-prototype.md", "docs/audits/2026-11-25-source-audit.md",
    "docs/third-party/README.md", "docs/third-party/provenance.csv",
    "docs/third-party/upstream-pins.csv", "docs/third-party/helium-engine-baseline.md",
    "packages/core/url-cleaner.mjs", "tests/url-cleaner.test.mjs", "tests/url-cleaner-ui.test.mjs", "docs/core/url-cleaner.md",
    "packages/core/webui-bridge-contract.mjs", "tests/webui-bridge-contract.test.mjs", "docs/security/webui-bridge-contract.md",
)
PROVENANCE_FIELDS = (
    "local_path", "upstream_project", "upstream_repository", "upstream_commit",
    "upstream_path", "original_license", "change_type", "notice_preserved",
    "reviewed_by", "review_date", "notes",
)
PIN_FIELDS = ("repository", "ref", "commit", "license_summary", "observed_role", "decision", "checked_at_utc", "helium_chromium_submodule", "helium_chromium_commit", "chromium_version", "notes")


def read_csv_header(path: Path) -> tuple[str, ...]:
    with path.open(newline="", encoding="utf-8") as handle:
        return tuple(next(csv.reader(handle), []))


def main() -> int:
    errors: list[str] = []
    for relative in REQUIRED_FILES:
        path = ROOT / relative
        if not path.is_file():
            errors.append(f"Missing required file: {relative}")
        elif path.stat().st_size == 0:
            errors.append(f"Required file is empty: {relative}")

    license_path = ROOT / "LICENSE"
    if license_path.is_file():
        license_text = license_path.read_text(encoding="utf-8", errors="replace")
        if "GNU GENERAL PUBLIC LICENSE" not in license_text or "Version 3" not in license_text:
            errors.append("LICENSE does not appear to contain the full GNU GPL version 3 text")

    provenance_path = ROOT / "docs/third-party/provenance.csv"
    if provenance_path.is_file() and read_csv_header(provenance_path) != PROVENANCE_FIELDS:
        errors.append("Provenance CSV header does not match the expected field order")

    pins_path = ROOT / "docs/third-party/upstream-pins.csv"
    if pins_path.is_file():
        if read_csv_header(pins_path) != PIN_FIELDS:
            errors.append("Upstream pins CSV header does not match the expected field order")
        else:
            with pins_path.open(newline="", encoding="utf-8") as handle:
                rows = list(csv.DictReader(handle))
            for row in rows:
                if len(row.get("commit", "")) != 40:
                    errors.append(f"Upstream pin is not a 40-character commit SHA: {row.get('repository')}")
            by_repo = {row.get("repository"): row for row in rows}
            required_repos = {"imputnet/helium", "imputnet/helium-macos", "imputnet/helium-linux", "imputnet/helium-windows", "phibrowser/phibrowser-mac", "crest-browser/Crest", "ardia-browser/ardia", "igorsyrbu/urlshortener-ui"}
            missing = required_repos - set(by_repo)
            if missing:
                errors.append(f"Upstream pins missing candidate repositories: {', '.join(sorted(missing))}")

            engine = by_repo.get("imputnet/helium")
            if engine:
                engine_commit = engine.get("commit", "")
                engine_version = engine.get("chromium_version", "")
                if not engine_version:
                    errors.append("Helium root pin is missing its verified chromium_version")
                for package_repo in ("imputnet/helium-macos", "imputnet/helium-linux", "imputnet/helium-windows"):
                    package = by_repo.get(package_repo)
                    if not package:
                        continue
                    if package.get("helium_chromium_submodule") != "helium-chromium":
                        errors.append(f"{package_repo} must record its helium-chromium submodule path")
                    if package.get("helium_chromium_commit") != engine_commit:
                        errors.append(f"{package_repo} helium-chromium gitlink does not match the pinned Helium root commit")
                    if package.get("chromium_version") != engine_version:
                        errors.append(f"{package_repo} Chromium version does not match the pinned Helium root version")

    readme_path = ROOT / "README.md"
    if readme_path.is_file():
        readme = readme_path.read_text(encoding="utf-8")
        if "This is not yet a browser" not in readme:
            errors.append("README must clearly disclose that the repository is not yet a browser")
        for platform in ("Windows", "Linux", "macOS"):
            if platform not in readme:
                errors.append(f"README is missing the {platform} target")

    if errors:
        print("Foundation validation failed:", file=sys.stderr)
        for error in errors:
            print(f" - {error}", file=sys.stderr)
        return 1

    print(f"Foundation validation passed ({len(REQUIRED_FILES)} files, license and CSV schemas checked).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
