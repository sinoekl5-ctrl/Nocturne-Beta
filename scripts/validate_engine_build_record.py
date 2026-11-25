#!/usr/bin/env python3
"""Validate a native engine build record against Nocturne's immutable source lock."""
from __future__ import annotations
import argparse, json, re, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SHA256=re.compile(r"^[0-9a-f]{64}$")
PLATFORMS={"macOS","Linux","Windows"}
STATUSES={"not-run","blocked","failed","succeeded"}
def validate_record(record:dict,lock:dict,require_success:bool=False)->list[str]:
    errors=[]
    if record.get("record_schema")!=1: errors.append("record_schema must be 1")
    status=record.get("status")
    if status not in STATUSES: errors.append(f"status must be one of {sorted(STATUSES)}")
    source=record.get("source",{}); platform=source.get("platform")
    if platform not in PLATFORMS and not (status=="not-run" and platform is None and not require_success): errors.append("source.platform must be macOS, Linux or Windows")
    if status=="succeeded" or require_success:
        if status!="succeeded": errors.append("record status is not succeeded")
        if platform not in lock.get("platform_packages",{}): errors.append("source.platform is not present in engine lock")
        else:
            pin=lock["platform_packages"][platform]
            if source.get("platform_repository")!=pin.get("repository"): errors.append("platform repository does not match engine lock")
            if source.get("platform_commit")!=pin.get("commit"): errors.append("platform commit does not match engine lock")
            if source.get("helium_root_commit")!=lock.get("helium",{}).get("commit"): errors.append("Helium root commit does not match engine lock")
            if source.get("chromium_version")!=lock.get("helium",{}).get("chromium_version"): errors.append("Chromium version does not match engine lock")
        for key in ("nocturne_commit","platform_repository","platform_commit","helium_root_commit","build_patch_series_commit"):
            if not source.get(key): errors.append(f"source.{key} is required for a successful record")
        host=record.get("host",{})
        for key in ("os_name","os_version_or_distro","architecture","cpu_model_and_cores","physical_ram_bytes","free_disk_bytes_before","toolchain_versions"):
            if host.get(key) in (None,"",{}): errors.append(f"host.{key} is required for a successful record")
        build=record.get("build",{})
        if build.get("exit_code")!=0: errors.append("build.exit_code must be 0")
        if not build.get("command") or not build.get("command_log_path"): errors.append("build command and log path are required")
        if not isinstance(build.get("elapsed_seconds"),(int,float)) or build.get("elapsed_seconds",0)<=0: errors.append("build.elapsed_seconds must be positive")
        hashes=build.get("artifact_sha256")
        if not isinstance(hashes,dict) or not hashes: errors.append("at least one build artifact SHA-256 is required")
        elif any(not SHA256.fullmatch(str(v)) for v in hashes.values()): errors.append("every artifact hash must be a 64-character lowercase SHA-256")
        runtime=record.get("runtime_smoke",{})
        for key in ("launch_success","first_run_success","real_navigation_success"):
            if runtime.get(key) is not True: errors.append(f"runtime_smoke.{key} must be true")
        if not runtime.get("smoke_test_log_path"): errors.append("runtime smoke-test log path is required")
        verification=record.get("verification",{})
        for key in ("source_shas_match_lock","build_completed","launch_test_completed"):
            if verification.get(key) is not True: errors.append(f"verification.{key} must be true")
        if not verification.get("reviewer") or not verification.get("reviewed_at_utc"): errors.append("reviewer and review timestamp are required")
    if status in {"blocked","failed"} and not record.get("runtime_smoke",{}).get("known_blockers"): errors.append("blocked/failed records must document known_blockers")
    return errors
def main()->int:
    p=argparse.ArgumentParser(description=__doc__); p.add_argument("record",type=Path); p.add_argument("--require-success",action="store_true"); a=p.parse_args()
    try:
        record=json.loads(a.record.read_text(encoding="utf-8")); lock=json.loads((ROOT/"docs/third-party/engine-set.json").read_text(encoding="utf-8"))
    except (OSError,json.JSONDecodeError) as exc: print(f"Cannot read record or engine lock: {exc}",file=sys.stderr); return 2
    errors=validate_record(record,lock,a.require_success)
    if errors:
        print("Native engine build record validation failed:",file=sys.stderr)
        for e in errors: print(f" - {e}",file=sys.stderr)
        return 1
    print(f"Build record valid ({record.get('status')}); this does not itself run or certify Chromium."); return 0
if __name__=="__main__": raise SystemExit(main())
