#!/usr/bin/env python3
"""Safely materialize the immutable upstream Helium platform checkout."""
from __future__ import annotations
import argparse, json, platform, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LOCK = ROOT / "docs/third-party/engine-set.json"
PLATFORM_MAP = {"Darwin":"macOS","Linux":"Linux","Windows":"Windows"}

def make_plan(lock: dict, platform_name: str, workspace: Path) -> dict:
    if platform_name not in lock.get("platform_packages", {}):
        raise ValueError(f"Unsupported platform: {platform_name}")
    item = lock["platform_packages"][platform_name]
    destination = workspace / platform_name.lower()
    return {
        "platform": platform_name,
        "repository": item["repository"],
        "commit": item["commit"],
        "submodule": "helium-chromium",
        "submodule_commit": item["helium_chromium_submodule"],
        "destination": str(destination),
        "commands": [
            ["git", "clone", "--no-checkout", f"https://github.com/{item['repository']}.git", str(destination)],
            ["git", "-C", str(destination), "checkout", "--detach", item["commit"]],
            ["git", "-C", str(destination), "submodule", "update", "--init", "--recursive"],
        ],
        "build": "Native build only; follow the selected upstream repository's instructions after verifying its toolchain.",
    }

def run(args: list[str], cwd: Path | None = None) -> str:
    result = subprocess.run(args, cwd=cwd, check=True, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    return result.stdout.strip()

def verify_checkout(destination: Path, plan: dict) -> None:
    actual = run(["git", "-C", str(destination), "rev-parse", "HEAD"])
    if actual != plan["commit"]:
        raise RuntimeError(f"Platform checkout SHA mismatch: expected {plan['commit']}, got {actual}")
    submodule = destination / plan["submodule"]
    if not submodule.is_dir():
        raise RuntimeError(f"Expected initialized submodule missing: {submodule}")
    actual_submodule = run(["git", "-C", str(submodule), "rev-parse", "HEAD"])
    if actual_submodule != plan["submodule_commit"]:
        raise RuntimeError(f"Helium submodule SHA mismatch: expected {plan['submodule_commit']}, got {actual_submodule}")
    dirty = run(["git", "-C", str(destination), "status", "--porcelain", "--ignore-submodules"])
    if dirty:
        raise RuntimeError("Platform checkout has local changes; refusing to modify it")

def materialize(plan: dict) -> Path:
    destination = Path(plan["destination"]).expanduser().resolve()
    if destination.exists():
        verify_checkout(destination, plan)
        print(f"Already verified; no changes made: {destination}")
        return destination
    destination.parent.mkdir(parents=True, exist_ok=True)
    commands = plan["commands"]
    try:
        run(commands[0])
        run(commands[1])
        run(commands[2])
        verify_checkout(destination, plan)
    except Exception:
        print(f"Checkout incomplete at {destination}; inspect it before retrying.", file=sys.stderr)
        raise
    print(f"Verified pinned {plan['platform']} source checkout: {destination}")
    print(f"Platform SHA: {plan['commit']}")
    print(f"Helium submodule SHA: {plan['submodule_commit']}")
    return destination

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--platform", choices=("macOS","Linux","Windows"), default=PLATFORM_MAP.get(platform.system()))
    parser.add_argument("--workspace", type=Path, default=Path.home()/".cache"/"nocturne"/"engine")
    parser.add_argument("--print-plan", action="store_true", help="Print the exact pinned checkout plan without network access")
    args = parser.parse_args()
    if not args.platform:
        parser.error("Specify --platform on an unsupported host")
    lock = json.loads(LOCK.read_text(encoding="utf-8"))
    plan = make_plan(lock, args.platform, args.workspace.expanduser().resolve())
    if args.print_plan:
        print(json.dumps(plan, indent=2))
        return 0
    if lock.get("verification", {}).get("native_builds_completed") is not False:
        print("Review engine-set.json before proceeding; build verification status changed.", file=sys.stderr)
        return 2
    try:
        materialize(plan)
    except (OSError, subprocess.CalledProcessError, RuntimeError) as exc:
        print(f"Engine checkout failed: {exc}", file=sys.stderr)
        return 1
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
