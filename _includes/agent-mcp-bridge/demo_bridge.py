"""Actual async SDK -> host adapter -> real local MCP; authored responses only."""
import argparse
import asyncio
from collections import deque
from importlib.metadata import version
import json
from pathlib import Path
import sys

import httpx2
from openai import AsyncOpenAI
from mcp import Client, StdioServerParameters

from bridge import BridgeRun
from contracts import load_catalog
from provider_fixtures import SCENARIOS, scenario_script


async def run_scenario(scenario="distance", max_requests=4, max_calls=3):
    if version("openai") != "3.50.0" or version("mcp") != "2.3.0":
        raise ValueError("Install the exact checked SDK versions")
    run = BridgeRun(load_catalog(), max_requests, max_calls)
    queue, exchanges = deque(scenario_script(scenario)), 0
    def handle(request):
        nonlocal exchanges
        if request.method != "POST" or str(request.url) != "https://offline.invalid/v1/responses" or not queue:
            raise AssertionError("Only this in-memory fixture is allowed; no fallback")
        payload = json.loads(request.content)
        if payload["model"] != "offline-fixture-model" or payload["store"] is not False:
            raise AssertionError("Authored fixture request changed")
        exchanges += 1
        return httpx2.Response(200, json=queue.popleft())
    process = StdioServerParameters(command=sys.executable,
        args=[str(Path(__file__).with_name("server.py"))], env={"PYTHONDONTWRITEBYTECODE": "1"})
    async with AsyncOpenAI(api_key="offline-fixture-not-a-credential", base_url="https://offline.invalid/v1",
        max_retries=0, timeout=15, http_client=httpx2.AsyncClient(transport=httpx2.MockTransport(handle), trust_env=False)) as provider:
        async with Client(process, mode="auto", read_timeout_seconds=5) as mcp:
            report = await run.run(provider, mcp, "offline-fixture-model", "PUBLIC SCRIPTED EXERCISE: " + scenario)
    report["model_called"] = False
    report["provider_provenance"] = "Actual SDK with authored in-memory HTTP fixtures; no model or socket"
    return {"schema_version": 1, "kind": "brook-scripted-agent-mcp-bridge", "scenario": scenario,
            "model_called": False, "provider_transport": "authored in-memory MockTransport",
            "tool_transport": "real local stdio", "sdk_exchanges": exchanges, "report": report}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--scenario", choices=SCENARIOS, default="distance")
    parser.add_argument("--max-requests", type=int, choices=range(1, 9), default=4)
    parser.add_argument("--max-calls", type=int, choices=range(1, 9), default=3)
    args = parser.parse_args()
    try:
        result = asyncio.run(asyncio.wait_for(run_scenario(args.scenario, args.max_requests, args.max_calls), timeout=20))
    except (TimeoutError, KeyboardInterrupt):
        print("Stopped locally; already sent requests/read calls are not undone. No answer inferred.", file=sys.stderr)
        return 1
    print(json.dumps(result, ensure_ascii=True, allow_nan=False, indent=2))
    return 0 if result["report"]["status"] == "answered" else 1


if __name__ == "__main__":
    raise SystemExit(main())
