#!/usr/bin/env python3
"""Launch a Chromium-compatible binary with a fresh profile and verify HTTPS DOM output."""
from __future__ import annotations
import argparse, json, subprocess, sys, tempfile, time
from pathlib import Path
from urllib.parse import urlparse

class SmokeTestError(RuntimeError):
    pass

def run_smoke(browser: Path, browser_args: list[str], url: str, expected: str, timeout: int = 90) -> dict:
    parsed = urlparse(url)
    if parsed.scheme != "https" or not parsed.netloc:
        raise SmokeTestError("Smoke-test URL must be a fully qualified HTTPS URL")
    if not browser.is_file():
        raise SmokeTestError(f"Browser executable does not exist: {browser}")
    with tempfile.TemporaryDirectory(prefix="nocturne-smoke-") as tmp:
        profile = Path(tmp) / "clean-profile"
        command = [str(browser), *browser_args, "--headless=new", "--disable-gpu",
                   "--no-first-run", "--no-default-browser-check",
                   f"--user-data-dir={profile}", "--dump-dom", url]
        started = time.monotonic()
        try:
            result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                   text=True, encoding="utf-8", errors="replace",
                                   timeout=timeout, check=False)
        except subprocess.TimeoutExpired as exc:
            raise SmokeTestError(f"Browser timed out after {timeout} seconds") from exc
        elapsed = round(time.monotonic() - started, 3)
        if result.returncode != 0:
            detail = (result.stderr or result.stdout)[-3000:]
            raise SmokeTestError(f"Browser exited with code {result.returncode}:\n{detail}")
        if not profile.is_dir():
            raise SmokeTestError("Browser did not create the requested fresh profile")
        if expected not in result.stdout:
            raise SmokeTestError(f"Expected page marker {expected!r} was not found in DOM output")
        return {"browser": str(browser.resolve()), "url": url, "profile_was_fresh": True,
                "exit_code": result.returncode, "expected_marker": expected,
                "marker_found": True, "elapsed_seconds": elapsed}

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--browser", type=Path, required=True, help="Path to the Chromium-compatible executable")
    parser.add_argument("--browser-arg", action="append", default=[], help="Extra browser argument (repeatable)")
    parser.add_argument("--url", default="https://example.com", help="HTTPS URL to load (default: https://example.com)")
    parser.add_argument("--expect", default="Example Domain", help="Text expected in the rendered DOM")
    parser.add_argument("--timeout", type=int, default=90)
    parser.add_argument("--record", type=Path, help="Optional path for a JSON smoke-test evidence record")
    args = parser.parse_args()
    if args.timeout < 1:
        parser.error("--timeout must be positive")
    try:
        record = run_smoke(args.browser.expanduser().resolve(), args.browser_arg,
                           args.url, args.expect, args.timeout)
        if args.record:
            args.record.parent.mkdir(parents=True, exist_ok=True)
            args.record.write_text(json.dumps(record, indent=2) + "\n", encoding="utf-8")
    except (OSError, SmokeTestError) as exc:
        print(f"Smoke test FAILED: {exc}", file=sys.stderr)
        return 1
    print(f"Smoke test PASSED: HTTPS DOM marker verified in {record['elapsed_seconds']}s")
    if args.record:
        print(f"Evidence: {args.record}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
