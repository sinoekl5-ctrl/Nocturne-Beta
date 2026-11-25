#!/usr/bin/env python3
"""Validate Nocturne's pinned Helium source set without network access."""
from __future__ import annotations
import csv, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHA = re.compile(r"^[0-9a-f]{40}$")
VERSION = re.compile(r"^\d+\.\d+\.\d+\.\d+$")

def validate_pin_set(lock: dict, rows: list[dict[str, str]]) -> list[str]:
    errors = []
    helium = lock.get("helium", {})
    repo, commit, version = helium.get("repository"), helium.get("commit", ""), helium.get("chromium_version", "")
    by_repo = {row.get("repository", ""): row for row in rows}
    if not SHA.fullmatch(commit): errors.append("Helium commit must be a full 40-character lowercase SHA")
    if not VERSION.fullmatch(version): errors.append("Chromium version must be four numeric components")
    if repo not in by_repo: errors.append(f"Missing upstream pin: {repo}")
    elif by_repo[repo].get("commit") != commit: errors.append("Helium commit differs from upstream-pins.csv")
    expected = {"macOS":"imputnet/helium-macos","Linux":"imputnet/helium-linux","Windows":"imputnet/helium-windows"}
    platforms = lock.get("platform_packages", {})
    if set(platforms) != set(expected): errors.append("Platform lock must contain exactly macOS, Linux and Windows")
    for platform, expected_repo in expected.items():
        item = platforms.get(platform, {})
        package_commit = item.get("commit", "")
        if item.get("repository") != expected_repo: errors.append(f"{platform} repository must be {expected_repo}")
        if not SHA.fullmatch(package_commit): errors.append(f"{platform} package commit must be a full 40-character SHA")
        if expected_repo not in by_repo: errors.append(f"Missing upstream pin: {expected_repo}")
        elif by_repo[expected_repo].get("commit") != package_commit: errors.append(f"{platform} commit differs from upstream-pins.csv")
        if item.get("helium_chromium_submodule") != commit: errors.append(f"{platform} helium-chromium gitlink differs from Helium root")
    if lock.get("status") != "source-pins-verified-build-not-verified": errors.append("Lock must distinguish source verification from build verification")
    if lock.get("verification", {}).get("native_builds_completed") is not False: errors.append("Native build status must remain false until builds are run")
    return errors

def main() -> int:
    try:
        lock = json.loads((ROOT/"docs/third-party/engine-set.json").read_text(encoding="utf-8"))
        with (ROOT/"docs/third-party/upstream-pins.csv").open(newline="",encoding="utf-8") as f:
            rows = list(csv.DictReader(f))
    except (OSError, json.JSONDecodeError, csv.Error) as exc:
        print(f"Cannot read engine pin inputs: {exc}", file=sys.stderr); return 2
    errors = validate_pin_set(lock, rows)
    if errors:
        print("Engine pin validation failed:", file=sys.stderr)
        for error in errors: print(f" - {error}", file=sys.stderr)
        return 1
    print(f"Engine pin set verified: Helium + 3 platform packages align; Chromium {lock['helium']['chromium_version']}. Native builds remain unverified.")
    return 0

if __name__ == "__main__": raise SystemExit(main())
