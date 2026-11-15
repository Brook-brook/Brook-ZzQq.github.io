"""Check exact public sources, then execute the extracted stdlib SQLite project.

Only owned temporary databases and actual child processes, never user files,
HTTP, accounts, models, private journals or an installed third-party package.
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
builder.check("restart")
with tempfile.TemporaryDirectory(prefix="brook-restart-package-") as directory:
    with zipfile.ZipFile(ROOT / "assets/examples/agent-restart.zip") as archive:
        archive.extractall(directory)
    project = Path(directory) / "brooks-agent-restart"
    entry = 'import sys,runpy;root,script=sys.argv[1:];sys.path.insert(0,root);sys.argv=[script];runpy.run_path(script,run_name="__main__")'
    for filename in ("run_checks.py", "demo_restart.py"):
        result = subprocess.run([sys.executable, "-I", "-S", "-B", "-c", entry, str(project), str(project / filename)],
                                cwd=project, capture_output=True, text=True, timeout=20)
        if result.returncode:
            raise RuntimeError(result.stdout + result.stderr)
        if filename == "run_checks.py":
            if "Ran 8 tests" not in result.stderr or "OK" not in result.stderr:
                raise AssertionError("The extracted restart checks did not complete")
            print(result.stderr.strip())
        else:
            rows = [json.loads(line) for line in result.stdout.splitlines()]
            if len(rows) != 6 or any(row["model_called"] is not False or row["transport"] != "actual-child-process-and-temporary-sqlite" for row in rows):
                raise AssertionError("The restart demo scope changed")
            if [(row["teaching_observer"][-1]["value"], row["teaching_observer"][-1]["effects"]) for row in rows] != [(2,1),(2,1),(2,1),(2,1),(3,2),(3,2)]:
                raise AssertionError("The actual restart effect counts changed")
            if [row["client_trace"][-1]["outcome"] for row in rows] != ["replayed","applied","found","conflict","applied","found"]:
                raise AssertionError("The actual recovery outcomes changed")
            for row in rows[:5]:
                if row["client_trace"][0]["response"] is not None or row["client_trace"][0]["process_exit_code"] != 75:
                    raise AssertionError("A missing child reply was invented")
            if rows[-1]["client_trace"][-1]["response"]["receipt"]["value_after"] != 2:
                raise AssertionError("Historical receipt was replaced with latest state")
            print(result.stdout.strip())
print("PASS actual restart ZIP: eight stdlib checks and six real child-process/SQLite scenarios; no HTTP, external action, private database or model")
