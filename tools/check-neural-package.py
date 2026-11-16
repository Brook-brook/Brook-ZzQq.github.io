"""Run the exact public manual-neural ZIP, stdlib only and without a model API."""
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
        builder.check("neural")
    with tempfile.TemporaryDirectory(prefix="brook-neural-check-") as directory:
        with zipfile.ZipFile(ROOT / "assets/examples/neural-basics.zip") as archive:
            archive.extractall(directory)
        project = Path(directory) / "brooks-neural-basics"
        entry = 'import sys,runpy;root,script=sys.argv[1:];sys.path.insert(0,root);sys.argv=[script];runpy.run_path(script,run_name="__main__")'
        def run(script):
            result = subprocess.run([sys.executable, "-I", "-S", "-B", "-c", entry, str(project), str(project / script)],
                                    cwd=project, capture_output=True, text=True, timeout=20)
            if result.returncode:
                raise RuntimeError(result.stdout + result.stderr)
            return result
        checks = run("run_checks.py")
        if "Ran 8 tests" not in checks.stderr or "OK" not in checks.stderr:
            raise AssertionError("Actual extracted manual chain-rule checks did not complete")
        print(checks.stderr.strip(), file=sys.stderr)
        records = [json.loads(line) for line in run("demo.py").stdout.splitlines()]
        if [row["hidden_activation"] for row in records] != ["tanh", "identity"]:
            raise AssertionError("Both real hidden-activation cases must run")
        if any(row["parameters_updated"] is not False or row["external_model_service"] is not False or len(row["rows"]) != 4 or len(row["mean_gradient"]) != 9 for row in records):
            raise AssertionError("The worked forward/backward scope changed")
        return records


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    records = execute()
    if args.json:
        print(json.dumps({"records": records}, ensure_ascii=False, allow_nan=False))
    else:
        for row in records:
            print(f"PASS actual neural CLI {row['hidden_activation']}: four forward rows, nine mean gradients, loss={row['mean_binary_cross_entropy']:.12f}; parameters_updated=false")
        print("PASS actual neural ZIP: eight stdlib checks, two executed forward/backward records; no optimizer, framework, LLM or independent test score")
