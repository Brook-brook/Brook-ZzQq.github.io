"""Check the current public ZIP, run its real six stdlib checks and both CLI cases."""
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
builder.check("async")
with tempfile.TemporaryDirectory(prefix="brook-async-check-") as directory:
    with zipfile.ZipFile(ROOT / "assets/examples/python-async-starter.zip") as archive:
        archive.extractall(directory)
    project = Path(directory) / "brooks-python-async"
    entry = 'import sys,runpy;root,script=sys.argv[1:];sys.path.insert(0,root);sys.argv=[script];runpy.run_path(script,run_name="__main__")'
    for filename in ("run_checks.py", "demo.py"):
        result = subprocess.run([sys.executable, "-I", "-S", "-B", "-c", entry, str(project), str(project / filename)], capture_output=True, text=True, timeout=15)
        if result.returncode:
            raise RuntimeError(result.stdout + result.stderr)
        if filename == "run_checks.py":
            if "Ran 6 tests" not in result.stderr or "OK" not in result.stderr:
                raise AssertionError("The actual extracted checks did not finish")
            print(result.stderr.strip())
        else:
            values = [json.loads(row) for row in result.stdout.splitlines()]
            if len(values) != 2 or [v["case"] for v in values] != ["cancel", "release"] or [v["task_cancelled"] for v in values] != [True, False] or not all(v["task_done"] and v["before_schedule"] == [] for v in values):
                raise AssertionError("The actual standalone entries changed")
            print(result.stdout.strip())
print("PASS actual async ZIP: six checks and two CLI cases with isolated stdlib; no SDK, model or socket fixture")
