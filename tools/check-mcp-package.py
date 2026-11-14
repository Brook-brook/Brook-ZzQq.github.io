"""SDK-free build guard plus real pure-tool execution from the public MCP ZIP."""
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
builder.check("mcp")
code = r'''
import importlib.util
import json
from pathlib import Path
import sys
sys.path.insert(0,sys.argv[1])
assert importlib.util.find_spec("openai") is None
assert importlib.util.find_spec("mcp") is None
import campus_tools as tools
catalog=tools.catalog_snapshot(json.loads(Path(sys.argv[1],"catalog.json").read_text(encoding="utf-8")))
assert len(catalog["places"])==6
result=tools.execute_read_tool({"name":"measure_distance","arguments":{"from":"main-library","to":"medical-library"}},catalog)
assert abs(result["result"]["distance_m"]-1020.225507)<.001
assert result["source_checked"]=="2026-11-02"
empty=tools.execute_read_tool({"name":"find_places","arguments":{"query":"食堂","category":"dining"}},catalog)
assert empty["result"]["count"]==0
try:
    tools.checked_call("nearby_places",'{"center":"main-library","radius_m":"200"}',catalog)
except ValueError:
    pass
else:
    raise AssertionError("Wrong-type radius must not execute")
print("PASS isolated standard-library tools from actual MCP ZIP; no protocol SDK or model imported")
'''
with tempfile.TemporaryDirectory(prefix="brook-mcp-build-check-") as directory:
    with zipfile.ZipFile(ROOT / "assets/examples/mcp-starter.zip") as archive:
        archive.extractall(directory)
    result = subprocess.run([sys.executable, "-I", "-S", "-B", "-c", code, str(Path(directory) / "brooks-mcp-starter")], capture_output=True, text=True, timeout=10)
    if result.returncode:
        raise RuntimeError(result.stderr)
    print(result.stdout.strip())
