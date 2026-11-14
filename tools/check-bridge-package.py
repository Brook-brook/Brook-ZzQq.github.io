"""SDK-free source/ZIP guard and isolated pure components, not MCP wire tests."""
import importlib.util
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
builder.check("bridge")
code = r'''
import importlib.util
import json
from pathlib import Path
import sys
sys.path.insert(0,sys.argv[1])
assert importlib.util.find_spec("openai") is None
assert importlib.util.find_spec("mcp") is None
import campus_tools as tools
import provider_fixtures as fixtures
catalog=tools.catalog_snapshot(json.loads(Path(sys.argv[1],"catalog.json").read_text(encoding="utf-8")))
batch=fixtures.scenario_script("batch")[0]["output"]
assert len(batch)==2
call=tools.checked_call(batch[0]["name"],batch[0]["arguments"],catalog)
result=tools.execute_read_tool(call,catalog)
assert abs(result["result"]["distance_m"]-1020.225507)<.001
assert result["source_checked"]=="2026-11-02"
assert len(fixtures.scenario_script("repeating"))==8
print("PASS actual ZIP pure tools/authored fixtures under isolated stdlib; no SDK, protocol or model executed")
'''
with tempfile.TemporaryDirectory(prefix="brook-bridge-build-check-") as directory:
    with zipfile.ZipFile(ROOT / "assets/examples/agent-mcp-bridge.zip") as archive:
        archive.extractall(directory)
    result = subprocess.run([sys.executable, "-I", "-S", "-B", "-c", code, str(Path(directory) / "brooks-agent-mcp-bridge")], capture_output=True, text=True, timeout=10)
    if result.returncode:
        raise RuntimeError(result.stderr)
    print(result.stdout.strip())
