"""Build/check a bounded public teaching archive with only tracked explicit inputs.

Python3 standard library only. No SDK import, credentials, socket or private files.
The public manifest lets the Node CI guard detect stale source/ZIP bytes without
adding Python or SDK requirements to the website build.
"""
import argparse
from hashlib import sha256
from io import BytesIO
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "tools/agent-starter-inputs.json"
ARCHIVE = ROOT / "assets/examples/agent-starter.zip"
MANIFEST = ROOT / "assets/examples/agent-starter.manifest.json"


def safe_relative(value):
    return isinstance(value, str) and bool(value) and not value.startswith("/") and "\\" not in value and ":" not in value and all(p not in (".", "..", "") and not p.startswith(".") for p in value.split("/"))


def inputs():
    config = json.loads(CONFIG.read_text())
    if set(config) != {"schema_version", "root", "files"} or config["schema_version"] != 1 or config["root"] != "brooks-agent-starter" or not 1 <= len(config["files"]) <= 20:
        raise ValueError("Invalid public archive config")
    names, rows, payload = set(), [], {}
    for row in config["files"]:
        if set(row) != {"name", "source"} or not safe_relative(row["name"]) or not safe_relative(row["source"]) or row["name"] == "MANIFEST.json" or row["name"] in names:
            raise ValueError("Invalid or duplicate archive path")
        names.add(row["name"])
        path = (ROOT / row["source"]).resolve()
        path.relative_to(ROOT)
        raw = path.read_bytes()
        if len(raw) > 256 * 1024:
            raise ValueError("An explicit public input is too large")
        payload[config["root"] + "/" + row["name"]] = raw
        rows.append({"name": row["name"], "source": row["source"], "sha256": sha256(raw).hexdigest(), "bytes": len(raw)})
    details = {"schema_version": 1, "kind": "brook-agent-starter", "root": config["root"], "files": rows}
    payload[config["root"] + "/MANIFEST.json"] = (json.dumps(details, ensure_ascii=False, indent=2) + "\n").encode()
    return details, payload


def public_manifest(details, raw):
    return {**details, "archive": {"path": "assets/examples/agent-starter.zip", "sha256": sha256(raw).hexdigest(), "bytes": len(raw)}}


def check():
    details, payload = inputs()
    raw = ARCHIVE.read_bytes()
    if len(raw) > 512 * 1024 or json.loads(MANIFEST.read_text()) != public_manifest(details, raw):
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
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    if args.check:
        check()
        return
    details, payload = inputs()
    buffer = BytesIO()
    with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for name, raw in sorted(payload.items()):
            info = zipfile.ZipInfo(name, date_time=(2026, 11, 14, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, raw, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
    raw = buffer.getvalue()
    ARCHIVE.write_bytes(raw)
    MANIFEST.write_text(json.dumps(public_manifest(details, raw), ensure_ascii=False, indent=2) + "\n")
    check()


if __name__ == "__main__":
    main()
