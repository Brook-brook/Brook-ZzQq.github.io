"""Replay three exact public teaching ZIP CLIs; whitelist public evidence only.

Requires the already checked SDK versions. No model, credential input, private
browser data or network provider. Website CI checks saved evidence separately.
"""
import argparse
from datetime import datetime
from hashlib import sha256
import importlib.util
from importlib.metadata import version
import json
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import zipfile

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
VERSIONS = {"openai": "3.50.0", "mcp": "2.3.0", "httpx2": "2.16.0"}
INPUTS = [("agent", "agent-starter", "brooks-agent-starter", "demo_offline.py"),
          ("mcp", "mcp-starter", "brooks-mcp-starter", "client_check.py"),
          ("bridge", "agent-mcp-bridge", "brooks-agent-mcp-bridge", "demo_bridge.py")]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--generated-at", required=True, help="Actual current ISO UTC, not a source freshness claim")
    args = parser.parse_args()
    if not re.fullmatch(r"\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ", args.generated_at):
        raise ValueError("Use an actual ISO UTC timestamp")
    datetime.fromisoformat(args.generated_at.replace("Z", "+00:00"))
    if {name: version(name) for name in VERSIONS} != VERSIONS:
        raise ValueError("Use the exact already checked example SDKs")
    spec = importlib.util.spec_from_file_location("brook_archive_builder", ROOT / "tools/build-agent-starter.py")
    builder = importlib.util.module_from_spec(spec); spec.loader.exec_module(builder)
    sources, values, catalog_bytes = [], {}, None
    for profile, stem, folder, script in INPUTS:
        builder.check(profile)
        path = ROOT / ("assets/examples/" + stem + ".zip")
        raw = path.read_bytes()
        with tempfile.TemporaryDirectory(prefix="brook-interface-case-") as directory:
            with zipfile.ZipFile(path) as archive:
                source = archive.read(folder + "/catalog.json")
                if catalog_bytes is not None and source != catalog_bytes:
                    raise ValueError("The three public catalog snapshots differ")
                catalog_bytes = source
                archive.extractall(directory)  # Already bounded/exact via builder.check.
            result = subprocess.run([sys.executable, script], cwd=Path(directory) / folder,
                env={"PATH": str(Path(sys.executable).parent), "PYTHONDONTWRITEBYTECODE": "1"},
                capture_output=True, text=True, timeout=30)
            if result.returncode or len(result.stdout) > 128000:
                raise RuntimeError(stem + " did not return its bounded public offline report")
            value = json.loads(result.stdout)
            if value.get("model_called") is not False:
                raise ValueError("Only the explicitly authored offline CLI modes belong in this case")
            values[profile] = value
        sources.append({"profile": profile, "path": path.relative_to(ROOT).as_posix(), "sha256": sha256(raw).hexdigest()})
    direct, mcp, bridge = values["agent"]["report"], values["mcp"], values["bridge"]["report"]
    if direct["status"] != "answered" or bridge["status"] != "answered" or direct["answer_fact_checked"] is not False or bridge["answer_fact_checked"] is not False:
        raise ValueError("Expected only the known authored-text modes")
    cases = [
        {"id": "direct-function", "scope": "Authored distance scenario; actual SDK and one local read function",
         "model_called": False, "final_text_returned": True, "answer_fact_checked": False,
         "counts": {"provider_requests_attempted": direct["requests_attempted"], "local_dispatch_attempts": direct["dispatch_attempts"], "observations": len(direct["observations"])},
         "provider_call_id": direct["observations"][0]["call_id"], "session": None,
         "selected_result": direct["observations"][0]["output"]},
        {"id": "mcp-client", "scope": "Distance subcase of a CLI that also checks same-ID, empty match and two rejections; not an Agent run",
         "model_called": False, "final_text_returned": False, "answer_fact_checked": None,
         "counts": {"returned_public_cases": len(mcp["public_cases"]), "returned_rejected_cases": len(mcp["rejected_cases"])},
         "provider_call_id": None,
         "session": {"protocol_version": mcp["protocol_version"], "discovery_received": mcp["discovery_received"], "self_reported_server": mcp["server_info"]},
         "selected_result": next(row["output"] for row in mcp["public_cases"] if row["case"] == "distance")},
        {"id": "host-mcp-bridge", "scope": "Authored distance scenario; actual async SDK, host and real local stdio",
         "model_called": False, "final_text_returned": True, "answer_fact_checked": False,
         "counts": {"provider_requests_attempted": bridge["provider_requests_attempted"], "mcp_call_attempts": bridge["mcp_call_attempts"], "receipts_accepted": bridge["receipts_accepted"]},
         "provider_call_id": bridge["observations"][0]["provider_call_id"], "session": bridge["session"],
         "selected_result": bridge["observations"][0]["output"]},
    ]
    canonical = lambda value: json.dumps(value, sort_keys=True, allow_nan=False)
    if len({canonical(row["selected_result"]) for row in cases}) != 1:
        raise ValueError("The same public distance case returned different values")
    report = {"schema_version": 1, "kind": "brook-agent-interface-teaching-case",
        "generated_at": args.generated_at, "python_version": sys.version.split()[0], "dependencies": VERSIONS,
        "generator_sha256": sha256(Path(__file__).read_bytes()).hexdigest(), "archive_sources": sources,
        "catalog": json.loads(catalog_bytes), "catalog_sha256": sha256(catalog_bytes).hexdigest(),
        "data_license": {"license": "ODbL-1.0", "license_url": "https://opendatacommons.org/licenses/odbl/1-0/",
                         "attribution": "OpenStreetMap contributors", "attribution_url": "https://www.openstreetmap.org/copyright"},
        "cases": cases,
        "scope": "Static public teaching replay. Authored provider responses, no live model, task benchmark, wire-ID capture, source refresh, routing or server-execution attestation. Counts have different meanings and must not be summed."}
    output = ROOT / "assets/examples/agent-interface-case.json"
    output.write_text(json.dumps(report, ensure_ascii=False, allow_nan=False, indent=2) + "\n", encoding="utf-8")
    print("PASS three actual public ZIP CLIs; matching selected distance, distinct evidence/counters; no raw question, hidden state or answer text published")


if __name__ == "__main__":
    main()
