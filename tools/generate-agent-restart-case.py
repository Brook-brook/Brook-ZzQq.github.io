"""Actually replay the exact public SQLite ZIP and save public teaching evidence.

No private database, journal, model, HTTP, user input or copied upstream content.
The timestamp is the actual UTC after execution, not a source/news freshness claim.
"""
import ast
from datetime import datetime, timezone
from hashlib import sha256
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import zipfile

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
GENERATOR = "tools/generate-agent-restart-case.py"


def main():
    spec = importlib.util.spec_from_file_location("brook_archive_builder", ROOT / "tools/build-agent-starter.py")
    builder = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(builder)
    builder.check("restart")
    archive_path = ROOT / "assets/examples/agent-restart.zip"
    raw = archive_path.read_bytes()
    with tempfile.TemporaryDirectory(prefix="brook-public-restart-case-") as directory:
        with zipfile.ZipFile(archive_path) as archive:
            source = archive.read("brooks-agent-restart/demo_restart.py").decode("utf-8")
            definitions = [node.value for node in ast.parse(source).body if isinstance(node, ast.Assign) and len(node.targets) == 1 and isinstance(node.targets[0], ast.Name) and node.targets[0].id == "SCENARIOS"]
            if len(definitions) != 1:
                raise ValueError("The exact public scenario declaration changed")
            settings = ast.literal_eval(definitions[0])
            archive.extractall(directory)  # Already bounded, exact and safe via builder.check.
        project = Path(directory) / "brooks-agent-restart"
        entry = 'import sys,runpy;root,script=sys.argv[1:];sys.path.insert(0,root);sys.argv=[script];runpy.run_path(script,run_name="__main__")'
        result = subprocess.run([sys.executable, "-I", "-S", "-B", "-c", entry, str(project), str(project / "demo_restart.py")],
                                cwd=project, capture_output=True, text=True, timeout=20)
        if result.returncode or result.stderr or not 0 < len(result.stdout.encode("utf-8")) <= 64000:
            raise RuntimeError("The exact public restart demo did not complete")
        reports = [json.loads(line) for line in result.stdout.splitlines()]
    if len(reports) != 6 or len(settings) != 6:
        raise ValueError("Expected the six owned public scenarios")
    cases = []
    for (name, steps), report in zip(settings, reports):
        if report.get("scenario") != name or report.get("model_called") is not False or report.get("observer_transport") != "separate-fresh-child-process":
            raise ValueError("Unexpected teaching scope")
        if len(report.get("client_trace", [])) != len(steps):
            raise ValueError("The actual trace does not match its full public parameters")
        injected = []
        for step, observed in zip(steps, report["client_trace"]):
            action, key, units, interrupt = step
            if (observed.get("action"), observed.get("key"), observed.get("units")) != (action, key, units):
                raise ValueError("The actual command differs from the scenario source")
            injected.append({"action": action, "key": key, "units": units, "interrupt": interrupt})
        cases.append({"injected_steps": injected, **report})
    value = {"schema_version": 1, "kind": "brook-sqlite-restart-case",
             "captured_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
             "archive": {"path": "assets/examples/agent-restart.zip", "sha256": sha256(raw).hexdigest(), "bytes": len(raw)},
             "generator": {"path": GENERATOR, "sha256": sha256((ROOT / GENERATOR).read_bytes()).hexdigest()},
             "cases": cases,
             "scope": "One actual replay of the exact original public ZIP. Injected steps are teaching configuration, client traces are received replies/exits, observers are separate fresh processes. No user DB/path, private journal, HTTP, model, external action, full Agent checkpoint, power-loss guarantee or publisher authentication."}
    output = ROOT / "assets/examples/agent-restart-case.json"
    output.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": output.relative_to(ROOT).as_posix(), "captured_at": value["captured_at"],
                      "archive_sha256": value["archive"]["sha256"], "cases": len(cases),
                      "python": cases[0]["python"], "sqlite": cases[0]["sqlite"], "model_called": False}))


if __name__ == "__main__":
    main()
