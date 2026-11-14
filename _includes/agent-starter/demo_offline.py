"""Original Brook exercise: real SDK and read tools, scripted in-memory responses.

No API credentials, socket, model, MCP server or private browser data are used.
Installing requirements may use a package index; execution after installation
uses only the bundled catalog and httpx2.MockTransport. Python>=3.11 / SDK3.50.0.
"""
import argparse
from collections import deque
import json
from pathlib import Path

import httpx2
import openai

from agent_loop import catalog_snapshot, run_agent, unique_object

SCENARIOS = ("distance", "batch", "forbidden", "wrong-type", "empty", "repeating")


def scripted_call(identifier, name, arguments):
    return {"type": "function_call", "id": "fc_" + identifier, "call_id": identifier,
            "name": name, "arguments": json.dumps(arguments, ensure_ascii=False), "status": "completed"}


def scripted_response(items):
    return {"id": "resp_scripted", "object": "response", "created_at": 0,
            "status": "completed", "model": "offline-fixture-model", "output": items,
            "parallel_tool_calls": True, "tools": [], "tool_choice": "auto", "metadata": {}}


def scenario_script(scenario):
    """These are authored test fixtures, never inference or an API recording."""
    if scenario not in SCENARIOS:
        raise ValueError("Choose one of the six public scripted scenarios")
    distance = scripted_call("distance_1", "measure_distance", {"from": "main-library", "to": "medical-library"})
    messages = {
        "distance": [distance],
        "batch": [distance, scripted_call("nearby_1", "nearby_places", {"center": "main-library", "radius_m": 200})],
        "forbidden": [scripted_call("forbidden_1", "publish_notes", {})],
        "wrong-type": [scripted_call("bad_type_1", "nearby_places", {"center": "main-library", "radius_m": "200"})],
        "empty": [scripted_call("empty_1", "find_places", {"query": "食堂", "category": "dining"})],
    }
    if scenario == "repeating":
        return [scripted_response([scripted_call("repeat_" + str(i), "find_places", {"query": "图书馆", "category": "library"})]) for i in range(8)]
    answer = {"type": "message", "id": "msg_scripted", "role": "assistant", "status": "completed",
              "content": [{"type": "output_text", "text": "SCRIPTED FIXTURE. Inspect the actual tool observations; no model answer or fact check was performed.", "annotations": []}]}
    return [scripted_response(messages[scenario]), scripted_response([answer])]


def run_scenario(scenario="distance", max_requests=4, max_dispatches=3):
    if openai.__version__ != "3.50.0":
        raise ValueError("Install the checked openai==3.50.0 before this exercise")
    queue = deque(scenario_script(scenario))
    exchanges = 0

    def handle(request):
        nonlocal exchanges
        if str(request.url) != "https://offline.invalid/v1/responses" or request.method != "POST":
            raise AssertionError("Only the in-memory Responses fixture is supported")
        if not queue:
            raise AssertionError("Unexpected extra SDK request; no network fallback exists")
        payload = json.loads(request.content)
        if payload["model"] != "offline-fixture-model" or payload["store"] is not False:
            raise AssertionError("The offline exercise contract changed")
        exchanges += 1
        return httpx2.Response(200, json=queue.popleft(), headers={"x-request-id": "req_scripted_" + str(exchanges)})

    data_path = Path(__file__).with_name("catalog.json")
    if data_path.stat().st_size > 256 * 1024:
        raise ValueError("Bundled public catalog is too large")
    catalog = catalog_snapshot(json.loads(data_path.read_text(encoding="utf-8"), object_pairs_hook=unique_object))
    # Explicit dummy key, reserved invalid URL and no environment proxy lookup.
    # MockTransport calls handle() directly; it never opens a socket.
    with openai.OpenAI(api_key="offline-fixture-not-a-credential", base_url="https://offline.invalid/v1",
                       max_retries=0, timeout=15.0,
                       http_client=httpx2.Client(transport=httpx2.MockTransport(handle), trust_env=False)) as client:
        report = run_agent(client, "offline-fixture-model", "PUBLIC SCRIPTED EXERCISE: " + scenario,
                           catalog, max_requests=max_requests, max_dispatches=max_dispatches)
    report["client_provenance"] = "Actual SDK with authored in-memory HTTP fixtures; no socket or model"
    return {"schema_version": 1, "kind": "brook-offline-agent-starter", "scenario": scenario,
            "model_called": False, "http_transport": "in-memory MockTransport", "sdk_exchanges": exchanges,
            "report": report}


def main():
    parser = argparse.ArgumentParser(description="Offline scripted learning exercise; no model, credentials or network fallback")
    parser.add_argument("--scenario", choices=SCENARIOS, default="distance")
    parser.add_argument("--max-requests", type=int, choices=range(1, 9), default=4)
    parser.add_argument("--max-dispatches", type=int, choices=range(1, 9), default=3)
    args = parser.parse_args()
    result = run_scenario(args.scenario, args.max_requests, args.max_dispatches)
    print(json.dumps(result, ensure_ascii=True, allow_nan=False, indent=2))
    # A nonzero result is expected for an authored failure/budget scenario.
    return 0 if result["report"]["status"] == "answered" else 1


if __name__ == "__main__":
    raise SystemExit(main())
