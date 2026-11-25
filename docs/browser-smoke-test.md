# Chromium-compatible browser smoke test

This is a **runtime check**, not a release installer or a Nocturne shell. Run it against a built Chromium/Helium executable to confirm that a fresh profile launches, an HTTPS page loads, and rendered DOM text is returned.

The helper uses Python's standard library only and never reuses a personal browser profile.

## Example

Linux/macOS:

```sh
python scripts/engine/smoke_test.py --browser /path/to/chromium-or-helium --url https://example.com --expect "Example Domain" --record smoke-evidence.json
```

Windows PowerShell:

```powershell
python scripts/engine/smoke_test.py --browser "C:\path\to\helium.exe" --url https://example.com --expect "Example Domain" --record smoke-evidence.json
```

If the browser executable requires a wrapper or extra launch options, repeat `--browser-arg` before the URL options. Do not pass a personal profile path. The script creates a temporary clean profile, enables headless DOM dumping, enforces a timeout and checks the expected marker. It rejects non-HTTPS URLs.

For a different test page, choose a stable public HTTPS URL and a unique text marker expected in its rendered DOM. A successful result proves only this smoke test on the recorded host; it does not prove Spaces isolation, privacy hardening, signing, update behavior, or release readiness.
