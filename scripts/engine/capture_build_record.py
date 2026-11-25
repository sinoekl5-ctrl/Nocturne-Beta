#!/usr/bin/env python3
"""Capture pinned-source, host, and artifact metadata after a native engine build."""
from __future__ import annotations
import argparse, hashlib, json, os, platform, shutil, subprocess, sys
from datetime import datetime, timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
PLATFORM_SYSTEM={"macOS":"Darwin","Linux":"Linux","Windows":"Windows"}
def run_version(command:list[str])->str:
    try:
        p=subprocess.run(command,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,timeout=20)
        return p.stdout.strip().splitlines()[0] if p.stdout.strip() else f"exit {p.returncode}"
    except (OSError,subprocess.TimeoutExpired): return "unavailable"
def sha256_file(path:Path)->str:
    h=hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda:f.read(1024*1024),b""): h.update(chunk)
    return h.hexdigest()
def physical_ram_bytes()->int|None:
    system=platform.system()
    try:
        if system=="Linux": return os.sysconf("SC_PAGE_SIZE")*os.sysconf("SC_PHYS_PAGES")
        if system=="Darwin": return int(subprocess.check_output(["sysctl","-n","hw.memsize"],text=True).strip())
        if system=="Windows": return int(subprocess.check_output(["powershell","-NoProfile","-Command","(Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory"],text=True).strip())
    except (OSError,ValueError,subprocess.SubprocessError): pass
    return None
def cpu_model()->str:
    if platform.system()=="Linux":
        try:
            for line in Path("/proc/cpuinfo").read_text().splitlines():
                if line.lower().startswith("model name"): return line.split(":",1)[1].strip()
        except OSError: pass
    if platform.system()=="Darwin": return run_version(["sysctl","-n","machdep.cpu.brand_string"])
    return platform.processor() or "unknown"
def git_head(path:Path)->str:
    return subprocess.check_output(["git","-C",str(path),"rev-parse","HEAD"],text=True).strip()
def capture_record(platform_name:str,workspace:Path,artifacts:list[Path],log:Path,command:str,elapsed:float,free_disk_before:int)->dict:
    lock=json.loads((ROOT/"docs/third-party/engine-set.json").read_text(encoding="utf-8"))
    if platform_name not in lock["platform_packages"]: raise ValueError(f"Unsupported platform: {platform_name}")
    package=workspace/platform_name.lower(); pin=lock["platform_packages"][platform_name]
    package_sha=git_head(package); helium_sha=git_head(package/"helium-chromium")
    if package_sha!=pin["commit"]: raise RuntimeError(f"Platform SHA mismatch: {package_sha}")
    if helium_sha!=pin["helium_chromium_submodule"]: raise RuntimeError(f"Helium gitlink SHA mismatch: {helium_sha}")
    if not log.is_file(): raise FileNotFoundError(f"Build log not found: {log}")
    found={}
    for item in artifacts:
        p=item.expanduser().resolve()
        if not p.is_file(): raise FileNotFoundError(f"Build artifact not found: {p}")
        found[p.name]=sha256_file(p)
    if not found: raise ValueError("At least one packaged artifact is required")
    system=platform.system(); tools={"python":sys.version.split()[0],"git":run_version(["git","--version"])}
    if system=="Linux": tools["docker"]=run_version(["docker","--version"])
    elif system=="Darwin": tools["xcode"]=run_version(["xcodebuild","-version"])
    elif system=="Windows": tools["visual_studio_compiler"]=run_version(["cmd","/c","cl"])
    template=json.loads((ROOT/"docs/engine-build-record-template.json").read_text(encoding="utf-8"))
    template.update(status="built-not-smoke-tested",created_at_utc=datetime.now(timezone.utc).isoformat())
    template["source"].update(nocturne_commit=git_head(ROOT),platform=platform_name,platform_repository=pin["repository"],platform_commit=package_sha,helium_root_commit=helium_sha,chromium_version=lock["helium"]["chromium_version"],build_patch_series_commit=None)
    template["host"].update(os_name=system,os_version_or_distro=platform.version(),kernel_or_build=platform.release(),architecture=platform.machine(),cpu_model_and_cores=f"{cpu_model()} ({os.cpu_count() or 'unknown'} logical cores)",physical_ram_bytes=physical_ram_bytes(),free_disk_bytes_before=free_disk_before,filesystem="record filesystem type separately",toolchain_versions=tools,display_stack=os.environ.get("WAYLAND_DISPLAY") or os.environ.get("DISPLAY") or "native/unknown")
    template["preparation"].update(command_log_path=str(log.resolve()),command_exit_code=0,elapsed_seconds=elapsed,prepared_source_sha=helium_sha,notes=[])
    template["build"].update(command=command,command_log_path=str(log.resolve()),exit_code=0,elapsed_seconds=elapsed,output_directory=str((package/"build").resolve()),artifact_sha256=found,warnings_and_errors=[])
    template["runtime_smoke"].update(launch_success=None,first_run_success=None,real_navigation_success=None,smoke_test_log_path=None,known_blockers=["Clean-profile launch and real navigation smoke test still required"])
    template["verification"].update(source_shas_match_lock=True,build_completed=True,launch_test_completed=False,reviewer=None,reviewed_at_utc=None)
    return template
def main()->int:
    p=argparse.ArgumentParser(description=__doc__); p.add_argument("--platform",required=True,choices=("macOS","Linux","Windows")); p.add_argument("--workspace",type=Path,required=True); p.add_argument("--artifact",type=Path,action="append",default=[]); p.add_argument("--build-log",type=Path,required=True); p.add_argument("--build-command",required=True); p.add_argument("--elapsed-seconds",type=float,required=True); p.add_argument("--free-disk-before",type=int,required=True); p.add_argument("--output",type=Path,required=True); a=p.parse_args()
    try:
        record=capture_record(a.platform,a.workspace.expanduser().resolve(),a.artifact,a.build_log,a.build_command,a.elapsed_seconds,a.free_disk_before)
        a.output.parent.mkdir(parents=True,exist_ok=True); a.output.write_text(json.dumps(record,indent=2)+"\n",encoding="utf-8")
    except (OSError,ValueError,RuntimeError,subprocess.SubprocessError) as e: print(f"Cannot capture build record: {e}",file=sys.stderr); return 1
    print(f"Captured build evidence ({record['status']}) at {a.output}"); return 0
if __name__=="__main__": raise SystemExit(main())
