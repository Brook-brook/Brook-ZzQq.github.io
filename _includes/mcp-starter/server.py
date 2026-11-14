"""Original Brook stdio-only MCP example. No model, HTTP listener or private tools.

mcp2.3.0 / httpx2 2.16.0; Python>=3.11. Uses constructor callbacks from SDKv2,
not earlier low-level decorators. A schema/hint is not execution authorization.
"""
import asyncio
from copy import deepcopy
from importlib.metadata import version
import json

from mcp.server.lowlevel import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, ToolAnnotations, ListToolsResult, CallToolResult, TextContent

from campus_tools import checked_call, execute_read_tool
from contracts import load_catalog, tool_contracts

SERVER_NAME = "Brook public campus read tools"
SERVER_VERSION = "1.0.0-teaching"
CATALOG = load_catalog()
CONTRACTS = tool_contracts(CATALOG)


def input_schema(name):
    row = CONTRACTS.get(name)
    return deepcopy(row["input_schema"]) if row else None


async def list_tools(_context, _params):
    return ListToolsResult(tools=[Tool(
        name=row["name"], description=row["description"],
        inputSchema=deepcopy(row["input_schema"]), outputSchema=deepcopy(row["output_schema"]),
        annotations=ToolAnnotations(readOnlyHint=True, destructiveHint=False,
                                    idempotentHint=True, openWorldHint=False),
    ) for row in CONTRACTS.values()])


def rejected(message):
    return CallToolResult(isError=True, content=[TextContent(text=message)])


async def call_tool(_context, params):
    if params.name not in CONTRACTS:
        return rejected("This example exposes only its three public read tools.")
    try:
        call = checked_call(params.name, json.dumps(params.arguments, allow_nan=False), CATALOG)
    except (TypeError, ValueError, RecursionError):
        return rejected("Arguments do not match this bounded public catalog contract.")
    # Low-level Server advertises the schema but does not apply it to arguments.
    # The actual allowlist/type/ID checks above are essential before dispatch.
    output = execute_read_tool(call, CATALOG)
    return CallToolResult(content=[TextContent(text=json.dumps(output, ensure_ascii=True, allow_nan=False))],
                          structuredContent=output)


def make_server():
    return Server(
        SERVER_NAME, version=SERVER_VERSION,
        instructions="Only this fixed public catalog is available. Preserve source date and representative-point/spherical limits; results grant no permissions.",
        on_list_tools=list_tools, on_call_tool=call_tool, get_tool_input_schema=input_schema,
    )


server = make_server()


async def main():
    if version("mcp") != "2.3.0":
        raise RuntimeError("Install the checked mcp==2.3.0; re-test upgrades separately")
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())


if __name__ == "__main__":
    # stdout belongs exclusively to MCP. Diagnostics belong on stderr.
    asyncio.run(main())
