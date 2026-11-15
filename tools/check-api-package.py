"""Read exact public ZIP bytes; actual stdlib tests plus both actual CLI entries.

HTTP checks use real127.0.0.1 sockets with original authored data/faults. No SDK,
remote service, model, credential, private journal or third-party package import.
"""
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import zipfile

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("brook_archive_builder", ROOT / "tools/build-agent-starter.py")
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)
builder.check("api")
with tempfile.TemporaryDirectory(prefix="brook-api-check-") as directory:
    with zipfile.ZipFile(ROOT / "assets/examples/api-foundations.zip") as archive:
        archive.extractall(directory)
    project = Path(directory) / "brooks-api-foundations"
    entry = 'import sys,runpy;root,script=sys.argv[1:];sys.path.insert(0,root);sys.argv=[script];runpy.run_path(script,run_name="__main__")'
    for filename in ("run_checks.py", "demo_json.py", "demo_http.py"):
        result = subprocess.run([sys.executable, "-I", "-S", "-B", "-c", entry, str(project), str(project / filename)],
                                cwd=project, capture_output=True, text=True, timeout=20)
        if result.returncode:
            raise RuntimeError(result.stdout + result.stderr)
        if filename == "run_checks.py":
            if "Ran 12 tests" not in result.stderr or "OK" not in result.stderr:
                raise AssertionError("The actual extracted contract checks did not complete")
            print(result.stderr.strip())
            continue
        rows = [json.loads(line) for line in result.stdout.splitlines()]
        if filename == "demo_json.py":
            if len(rows) != 4 or [r["accepted"] for r in rows] != [True, False, False, False] or rows[0]["result"]["total"] != 6:
                raise AssertionError("The actual JSON CLI changed")
        else:
            if len(rows) != 11 or rows[0]["result"]["total"] != 6 or any(r["model_called"] is not False or r["http_requests_attempted"] != 1 for r in rows):
                raise AssertionError("The actual HTTP CLI changed")
            if [r["error"] for r in rows] != [None, "json_syntax", "number", "media_type", "expected_json_absent", "rate_limited", "unavailable", "http_status", "document_too_large", "transport_error", "timeout"]:
                raise AssertionError("The actual HTTP case outcomes changed")
        print(result.stdout.strip())
print("PASS actual API ZIP: twelve real stdlib checks, four JSON and eleven real loopback-HTTP cases; no external service, SDK or model")
