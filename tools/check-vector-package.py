"""Actually extract/run the public lexical-vector ZIP with Python stdlib only."""
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
        builder.check("vectors")
    with tempfile.TemporaryDirectory(prefix="brook-vector-check-") as directory:
        with zipfile.ZipFile(ROOT / "assets/examples/retrieval-vectors.zip") as archive:
            archive.extractall(directory)
        project = Path(directory) / "brooks-retrieval-vectors"
        entry = 'import sys,runpy;root,script,*args=sys.argv[1:];sys.path.insert(0,root);sys.argv=[script,*args];runpy.run_path(script,run_name="__main__")'
        def run(script, *arguments):
            result = subprocess.run([sys.executable, "-I", "-S", "-B", "-c", entry, str(project), str(project / script), *arguments],
                                    cwd=project, capture_output=True, text=True, timeout=20)
            if result.returncode:
                raise RuntimeError(result.stdout + result.stderr)
            return result
        checks = run("run_checks.py")
        if "Ran 10 tests" not in checks.stderr or "OK" not in checks.stderr:
            raise AssertionError("Actual extracted vector checks did not finish")
        print(checks.stderr.strip(), file=sys.stderr)
        records = [json.loads(line) for line in run("demo.py", "--case", "all").stdout.splitlines()]
        if len(records) != 5 or any(row["kind"] != "brook-lexical-vector-search" or row["model_called"] is not False for row in records):
            raise AssertionError("Five actual bounded cases and scope must remain explicit")
        for row in records:
            snapshot = row["snapshot"]
            if snapshot["index"]["document_count"] != 8 or len(snapshot["registry"]["vocabulary"]) != 14:
                raise AssertionError("The actual shared corpus or explicit registry changed")
        if records[3]["snapshot"]["query"]["unit_vector"] is not None or records[3]["snapshot"]["ranked_ids"] != [] or records[3]["snapshot"]["literal_baseline"]["candidate_count"] <= 0:
            raise AssertionError("The missing-feature counterexample must remain observable")
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
            snapshot = row["snapshot"]
            print(f"PASS actual vector CLI {snapshot['settings']}: ranked={snapshot['ranked_ids']}, query_norm={snapshot['query']['norm']:.12f}")
        print("PASS exact10-entry vector ZIP:10 stdlib checks,5 actual CLI cases,8-fragment index,14 explicit features; no semantic model or network")
