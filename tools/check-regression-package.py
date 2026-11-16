"""Execute the exact public ZIP in an isolated stdlib-only Python process."""
import argparse
from contextlib import redirect_stdout
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


def execute():
    with redirect_stdout(sys.stderr):
        builder.check("regression")
    with tempfile.TemporaryDirectory(prefix="brook-gradient-check-") as directory:
        with zipfile.ZipFile(ROOT / "assets/examples/linear-regression-starter.zip") as archive:
            archive.extractall(directory)
        project = Path(directory) / "brooks-linear-regression"
        entry = 'import sys,runpy;root,script,*args=sys.argv[1:];sys.path.insert(0,root);sys.argv=[script,*args];runpy.run_path(script,run_name="__main__")'
        def run(script, *args):
            result = subprocess.run([sys.executable, "-I", "-S", "-B", "-c", entry,
                                     str(project), str(project / script), *args],
                                    cwd=project, capture_output=True, text=True, timeout=20)
            if result.returncode:
                raise RuntimeError(result.stdout + result.stderr)
            return result
        checks = run("run_checks.py")
        if "Ran 12 tests" not in checks.stderr or "OK" not in checks.stderr:
            raise AssertionError("Actual extracted equation/isolation checks did not finish")
        print(checks.stderr.strip(), file=sys.stderr)
        default = json.loads(run("demo.py").stdout)
        cases = [json.loads(line) for line in run("demo.py", "--case", "all").stdout.splitlines()]
        if [row["case"] for row in cases] != ["first", "stable", "oscillating", "guarded", "mixed"]:
            raise AssertionError("Actual CLI cases changed")
        if default != cases[0] or any(row["external_model_service"] is not False for row in cases):
            raise AssertionError("CLI provenance changed")
        if [row["run"]["stop"] for row in cases] != [None, "update_budget", None, "numeric_limit", None]:
            raise AssertionError("Actual stopping outcomes changed")
        return cases


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    cases = execute()
    if args.json:
        print(json.dumps({"cases": cases}, ensure_ascii=False, allow_nan=False))
    else:
        for case in cases:
            run = case["run"]
            print(f"PASS actual CLI {case['case']}: {len(run['history'])-1} applied updates; stop={run['stop']}")
        print("PASS actual regression ZIP: twelve stdlib checks, five executed cases; real linear training, no LLM or external service")
