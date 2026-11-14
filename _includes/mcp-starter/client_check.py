"""Actual local stdio protocol checks, not a model/host compatibility benchmark."""
import argparse
import asyncio
from importlib.metadata import version
import json
import math
from pathlib import Path
import sys

from mcp import Client, MCPError, StdioServerParameters
from mcp.types import TextContent
from contracts import load_catalog, TOOL_NAMES


def verify_output(result):
    if result.is_error or not isinstance(result.structured_content, dict):
        raise AssertionError("Expected successful structured public output")
    text = [part.text for part in result.content if isinstance(part, TextContent)]
    if len(text) != 1 or json.loads(text[0]) != result.structured_content:
        raise AssertionError("The public text and structured representations differ")
    value = result.structured_content
    if value["source_checked"] != "2026-11-02" or value["catalog_size"] != 6:
        raise AssertionError("The fixed source snapshot changed")
    return value


async def check_stdio(mode="auto"):
    if version("mcp") != "2.3.0":
        raise RuntimeError("Use the checked mcp==2.3.0")
    process = StdioServerParameters(command=sys.executable,
        args=[str(Path(__file__).with_name("server.py"))], env={"PYTHONDONTWRITEBYTECODE": "1"})
    async with Client(process, mode=mode, read_timeout_seconds=5) as client:
        discovered = client.session.discover_result is not None
        expected = "2026-07-28" if mode == "auto" else "2025-11-25"
        if client.protocol_version != expected or discovered != (mode == "auto"):
            raise AssertionError("The real negotiation did not match the selected mode")
        listed = await client.list_tools()
        if [row.name for row in listed.tools] != list(TOOL_NAMES):
            raise AssertionError("Expected exactly the three public tools")
        caps = client.server_capabilities
        if caps.tools is None or caps.resources is not None or caps.prompts is not None:
            raise AssertionError("This example should advertise only its tool family")
        # Concurrent awaited calls also exercise actual SDK/stdio correlation.
        distance, zero, empty = await asyncio.gather(
            client.call_tool("measure_distance", {"from": "main-library", "to": "medical-library"}),
            client.call_tool("measure_distance", {"from": "main-library", "to": "main-library"}),
            client.call_tool("find_places", {"query": "食堂", "category": "dining"}),
        )
        values = [verify_output(row) for row in (distance, zero, empty)]
        points = {row["id"]: row["coordinates"] for row in load_catalog()["places"]}
        lon1, lat1 = map(math.radians, points["main-library"])
        lon2, lat2 = map(math.radians, points["medical-library"])
        reference = 6371008.8 * math.acos(max(-1, min(1,
            math.sin(lat1) * math.sin(lat2) + math.cos(lat1) * math.cos(lat2) * math.cos(lon2 - lon1))))
        if abs(values[0]["result"]["distance_m"] - reference) > .001 or values[1]["result"]["distance_m"] != 0 or values[2]["result"]["count"] != 0:
            raise AssertionError("The actual public tool results do not match these cases")
        invalid = []
        for name, arguments in [("nearby_places", {"center": "main-library", "radius_m": "200"}),
                                ("publish_notes", {})]:
            result = await client.call_tool(name, arguments)
            if not result.is_error or result.structured_content is not None:
                raise AssertionError("Invalid calls must not become successful results")
            invalid.append({"tool": name, "is_error": result.is_error,
                            "messages": [part.text for part in result.content if isinstance(part, TextContent)]})
        identity = client.server_info
        return {"schema_version": 1, "kind": "brook-local-mcp-check", "transport": "local stdio",
                "sdk_version": version("mcp"), "mode": mode, "protocol_version": client.protocol_version,
                "discovery_received": discovered, "server_info": {"name": identity.name, "version": identity.version} if identity else None,
                "model_called": False, "tools": [row.name for row in listed.tools],
                "public_cases": [{"case": name, "is_error": result.is_error, "output": value}
                                 for name, result, value in zip(("distance", "same-id", "empty-catalog-match"), (distance, zero, empty), values)],
                "rejected_cases": invalid,
                "scope": "Fixed public representative points; no routing, model answer, source refresh, remote HTTP or authentication test"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--mode", choices=("auto", "legacy"), default="auto")
    args = parser.parse_args()
    try:
        result = asyncio.run(asyncio.wait_for(check_stdio(args.mode), timeout=20))
    except (MCPError, RuntimeError, AssertionError, TimeoutError):
        print("Local protocol checks did not complete. Check the pinned environment and server; no success was inferred.", file=sys.stderr)
        return 1
    print(json.dumps(result, ensure_ascii=True, allow_nan=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
