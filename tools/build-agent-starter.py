"""Build/check explicit bounded public teaching archives, Python3 stdlib only.

No SDK import, credential, socket or private input. The default agent profile is
backwards compatible; mcp extracts only named original read-tool functions so a
protocol server need not import a model SDK. All transforms happen at packaging.
"""
import argparse
import ast
from hashlib import sha256
from io import BytesIO
import json
from pathlib import Path
import re
import zipfile

ROOT = Path(__file__).resolve().parents[1]
PROFILES = {
    "agent": ("agent-starter", "brooks-agent-starter", "brook-agent-starter"),
    "mcp": ("mcp-starter", "brooks-mcp-starter", "brook-mcp-starter"),
    "bridge": ("agent-mcp-bridge", "brooks-agent-mcp-bridge", "brook-agent-mcp-bridge"),
    "async": ("python-async-starter", "brooks-python-async", "brook-python-async"),
}
TOOL_FUNCTIONS = {"text", "catalog_snapshot", "unique_object", "checked_call", "distance", "execute_read_tool", "tool_schemas"}
TOOL_CONSTANTS = {"CATEGORIES", "RADIUS_M"}


def safe_relative(value):
    return isinstance(value, str) and re.fullmatch(r"[A-Za-z0-9_-][A-Za-z0-9_./-]*", value) and all(p and not p.startswith(".") for p in value.split("/"))


def read_tools(raw):
    source = raw.decode("utf-8")
    nodes, found, constants = [], set(), set()
    for node in ast.parse(source).body:
        if isinstance(node, ast.FunctionDef) and node.name in TOOL_FUNCTIONS:
            nodes.append(ast.get_source_segment(source, node)); found.add(node.name)
        elif isinstance(node, ast.Assign):
            names = {target.id for target in node.targets if isinstance(target, ast.Name)}
            if names & TOOL_CONSTANTS:
                if not names <= TOOL_CONSTANTS:
                    raise ValueError("Unexpected combined constant assignment")
                nodes.append(ast.get_source_segment(source, node)); constants.update(names)
    if found != TOOL_FUNCTIONS or constants != TOOL_CONSTANTS:
        raise ValueError("Canonical read-tool definitions changed; inspect before packaging")
    header = ('"""Generated original Brook read tools; no model SDK. Do not edit this copy.\n'
              'Canonical: assets/examples/agent_loop.py, SHA256 ' + sha256(raw).hexdigest() + '\n"""\n'
              'from copy import deepcopy\nfrom datetime import date\nimport json\nimport math\nimport re\nimport unicodedata\n\n')
    return (header + "\n\n".join(nodes) + "\n").encode("utf-8")


def provider_fixtures(raw):
    source = raw.decode("utf-8")
    functions = {"scripted_call", "scripted_response", "scenario_script"}
    nodes, found, constants = [], set(), set()
    for node in ast.parse(source).body:
        if isinstance(node, ast.FunctionDef) and node.name in functions:
            if node.name in found:
                raise ValueError("Duplicate fixture definition")
            nodes.append(ast.get_source_segment(source, node)); found.add(node.name)
        elif isinstance(node, ast.Assign) and len(node.targets) == 1 and isinstance(node.targets[0], ast.Name) and node.targets[0].id == "SCENARIOS":
            nodes.append(ast.get_source_segment(source, node)); constants.add("SCENARIOS")
    if found != functions or constants != {"SCENARIOS"}:
        raise ValueError("Canonical authored fixture definitions changed")
    header = ('"""Generated original Brook authored fixtures, never model inference.\n'
              'Canonical: _includes/agent-starter/demo_offline.py, SHA256 ' + sha256(raw).hexdigest() + '\n"""\nimport json\n\n')
    return (header + "\n\n".join(nodes) + "\n").encode("utf-8")


def inputs(profile):
    stem, root, kind = PROFILES[profile]
    config = json.loads((ROOT / ("tools/" + stem + "-inputs.json")).read_text(encoding="utf-8"))
    if set(config) != {"schema_version", "root", "files"} or type(config["schema_version"]) is not int or config["schema_version"] != 1 or config["root"] != root or not isinstance(config["files"], list) or not 1 <= len(config["files"]) <= 20:
        raise ValueError("Invalid public archive config")
    names, rows, payload = set(), [], {}
    for row in config["files"]:
        if set(row) not in ({"name", "source"}, {"name", "source", "extract"}) or not safe_relative(row["name"]) or not safe_relative(row["source"]) or row["name"].lower() == "manifest.json" or row["name"].lower() in names:
            raise ValueError("Invalid or duplicate archive path")
        names.add(row["name"].lower())
        path = (ROOT / row["source"]).resolve(); path.relative_to(ROOT)
        original = path.read_bytes()
        if not 0 < len(original) <= 256 * 1024:
            raise ValueError("An explicit public input is empty/too large")
        raw = original
        if "extract" in row:
            if row["extract"] == "campus-read-tools-v1" and row["source"] == "assets/examples/agent_loop.py":
                raw = read_tools(original)
            elif row["extract"] == "scripted-provider-fixtures-v1" and row["source"] == "_includes/agent-starter/demo_offline.py":
                raw = provider_fixtures(original)
            else:
                raise ValueError("Unsupported public-source transform")
        payload[root + "/" + row["name"]] = raw
        record = {"name": row["name"], "source": row["source"], "sha256": sha256(raw).hexdigest(), "bytes": len(raw)}
        if "extract" in row:
            record.update(transform=row["extract"], source_sha256=sha256(original).hexdigest())
        rows.append(record)
    details = {"schema_version": 1, "kind": kind, "root": root, "files": rows}
    payload[root + "/MANIFEST.json"] = (json.dumps(details, ensure_ascii=False, indent=2) + "\n").encode()
    return details, payload


def paths(profile):
    stem = PROFILES[profile][0]
    return ROOT / ("assets/examples/" + stem + ".zip"), ROOT / ("assets/examples/" + stem + ".manifest.json")


def public_manifest(details, raw, archive):
    return {**details, "archive": {"path": archive.relative_to(ROOT).as_posix(), "sha256": sha256(raw).hexdigest(), "bytes": len(raw)}}


def check(profile):
    details, payload = inputs(profile)
    archive_path, manifest = paths(profile)
    raw = archive_path.read_bytes()
    if len(raw) > 512 * 1024 or json.loads(manifest.read_text(encoding="utf-8")) != public_manifest(details, raw, archive_path):
        raise ValueError("Stale or invalid public archive manifest; regenerate")
    with zipfile.ZipFile(BytesIO(raw)) as archive:
        if len(archive.infolist()) != len(payload) or set(archive.namelist()) != set(payload):
            raise ValueError("Unexpected/missing/duplicate archive entries")
        for info in archive.infolist():
            if info.file_size != len(payload[info.filename]) or archive.read(info) != payload[info.filename]:
                raise ValueError("Archive payload differs from its explicit public source")
    print(f"PASS starter archive: {len(payload)} exact bounded entries, current sources, full catalog and licenses; no SDK or model executed")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--profile", choices=PROFILES, default="agent")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    if args.check:
        check(args.profile)
        return
    details, payload = inputs(args.profile)
    buffer = BytesIO()
    with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for name, raw in sorted(payload.items()):
            info = zipfile.ZipInfo(name, date_time=(2026, 11, 14, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, raw, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
    raw = buffer.getvalue()
    archive_path, manifest = paths(args.profile)
    archive_path.write_bytes(raw)
    manifest.write_text(json.dumps(public_manifest(details, raw, archive_path), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    check(args.profile)


if __name__ == "__main__":
    main()
