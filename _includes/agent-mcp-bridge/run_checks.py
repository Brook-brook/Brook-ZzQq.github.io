"""Original executable teaching contracts, not live model performance or a sandbox."""
import asyncio
from collections import deque
from contextlib import asynccontextmanager, ExitStack
from copy import deepcopy
import json
import math
import socket
import unittest
from unittest.mock import AsyncMock, patch

import httpx2
from openai import AsyncOpenAI
from mcp import Client
from mcp.types import TextContent, CallToolResult

from bridge import BridgeRun
from contracts import load_catalog
from demo_bridge import run_scenario
from provider_fixtures import scripted_call, scripted_response, scenario_script
import server as service


@asynccontextmanager
async def provider_for(script, seen=None, on_request=None):
    queue = deque(deepcopy(script))
    async def handle(request):
        if str(request.url) != "https://offline.invalid/v1/responses" or request.method != "POST":
            raise AssertionError("Only the authored in-memory fixture is allowed")
        value = json.loads(request.content)
        if seen is not None:
            seen.append(value)
        if on_request:
            await on_request(value)
        if not queue:
            raise AssertionError("Unexpected extra provider request")
        return httpx2.Response(200, json=queue.popleft())
    async with AsyncOpenAI(api_key="offline-fixture-not-a-credential", base_url="https://offline.invalid/v1",
        max_retries=0, timeout=15, http_client=httpx2.AsyncClient(transport=httpx2.MockTransport(handle), trust_env=False)) as provider:
        yield provider


async def local_run(script, max_requests=4, max_calls=3, seen=None):
    run = BridgeRun(load_catalog(), max_requests, max_calls)
    async with provider_for(script, seen) as provider, Client(service.make_server()) as mcp:
        report = await run.run(provider, mcp, "offline-fixture-model", "PUBLIC FIXTURE QUESTION")
    return report


class BridgeChecks(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.guards = ExitStack()
        # Parent-process connection guard; not an OS sandbox for subprocesses.
        self.guards.enter_context(patch.object(socket.socket, "connect", side_effect=AssertionError("No socket connection permitted")))
        self.guards.enter_context(patch.object(socket, "create_connection", side_effect=AssertionError("No network fallback permitted")))
        self.addCleanup(self.guards.close)

    async def test_real_stdio_distance_and_independent_numeric_reference(self):
        result = await run_scenario()
        r = result["report"]
        self.assertEqual((r["status"], r["provider_requests_attempted"], r["mcp_call_attempts"], r["receipts_accepted"]), ("answered", 2, 1, 1))
        self.assertEqual(r["session"]["protocol_version"], "2026-07-28")
        self.assertTrue(r["session"]["discovery_received"])
        self.assertEqual(result["tool_transport"], "real local stdio")
        self.assertFalse(result["model_called"]); self.assertFalse(r["answer_fact_checked"])
        self.assertIn("SCRIPTED FIXTURE", r["answer"])
        points = {p["id"]: p["coordinates"] for p in r["source"]["places"]}
        lon1, lat1 = map(math.radians, points["main-library"])
        lon2, lat2 = map(math.radians, points["medical-library"])
        reference = 6371008.8 * math.acos(min(1, max(-1, math.sin(lat1) * math.sin(lat2) + math.cos(lat1) * math.cos(lat2) * math.cos(lon2-lon1))))
        self.assertAlmostEqual(r["observations"][0]["output"]["result"]["distance_m"], reference, delta=.001)
        self.assertEqual(r["source"]["checked"], "2026-11-02")

    async def test_real_stdio_batch_and_partial_budget_do_not_fabricate_work(self):
        full = (await run_scenario("batch"))["report"]
        partial = (await run_scenario("batch", max_calls=1))["report"]
        self.assertEqual((full["provider_requests_attempted"], full["mcp_call_attempts"], full["receipts_accepted"]), (2, 2, 2))
        self.assertEqual([row["provider_call_id"] for row in full["observations"]], ["distance_1", "nearby_1"])
        self.assertEqual((partial["status"], partial["provider_requests_attempted"], partial["mcp_call_attempts"]), ("budget_exhausted", 1, 1))
        self.assertEqual(len(partial["observations"]), 1); self.assertIsNone(partial["answer"])

    async def test_invalid_second_proposal_prevents_the_entire_batch(self):
        script = scenario_script("batch")
        script[0]["output"][1] = scripted_call("forbidden_1", "publish_notes", {})
        r = await local_run(script)
        self.assertEqual((r["status"], r["reason"], r["mcp_call_attempts"]), ("failed", "invalid_tool_calls", 0))
        self.assertEqual(r["observations"], [])

    async def test_wrong_type_duplicate_call_id_and_unsupported_form_never_dispatch(self):
        scripts = [scenario_script("wrong-type")]
        duplicate = scenario_script("batch")
        duplicate[0]["output"][1]["call_id"] = "distance_1"; scripts.append(duplicate)
        asynchronous = scenario_script("distance")
        asynchronous[0]["output"][0]["async"] = True; scripts.append(asynchronous)
        for script in scripts:
            with self.subTest(proposal=script[0]["output"]):
                r = await local_run(script)
                self.assertEqual((r["reason"], r["mcp_call_attempts"]), ("invalid_tool_calls", 0))

    async def test_provider_continuation_uses_its_call_id_and_retains_required_context_only_there(self):
        script, seen = scenario_script("distance"), []
        script[0]["output"].insert(0, {"type": "reasoning", "id": "rs_fixture", "summary": [], "encrypted_content": "SYNTHETIC_ENCRYPTED_STATE"})
        r = await local_run(script, seen=seen)
        continuation = seen[1]["input"]
        output = next(row for row in continuation if row.get("type") == "function_call_output")
        self.assertEqual(output["call_id"], "distance_1")
        self.assertEqual(json.loads(output["output"]), r["observations"][0]["output"])
        self.assertTrue(any(row.get("encrypted_content") == "SYNTHETIC_ENCRYPTED_STATE" for row in continuation))
        self.assertNotIn("SYNTHETIC_ENCRYPTED_STATE", json.dumps(r))
        self.assertNotIn("PUBLIC FIXTURE QUESTION", json.dumps(r))
        self.assertIsNone(r["model_called"], "The generic adapter cannot attest to a caller's inference transport")

    async def test_output_schema_failure_is_not_an_accepted_receipt(self):
        with patch.object(service, "execute_read_tool", return_value={"result": {}}):
            r = await local_run(scenario_script("distance"))
        self.assertEqual((r["reason"], r["mcp_failures"], r["receipts_accepted"], r["receipts_rejected"]), ("mcp_transport_or_schema", 1, 0, 0))
        self.assertEqual(r["provider_requests_attempted"], 1); self.assertIsNone(r["answer"])

    async def test_valid_shape_wrong_fact_and_mismatched_text_stop_before_continuation(self):
        call = {"name": "measure_distance", "arguments": {"from": "main-library", "to": "medical-library"}}
        wrong = service.execute_read_tool(call, service.CATALOG); wrong["result"]["distance_m"] = 999
        with patch.object(service, "execute_read_tool", return_value=wrong):
            r = await local_run(scenario_script("distance"))
        self.assertEqual((r["reason"], r["mcp_failures"], r["receipts_rejected"], r["receipts_accepted"]), ("unaccepted_mcp_receipt", 0, 1, 0))
        self.assertEqual(r["provider_requests_attempted"], 1)
        correct = service.execute_read_tool(call, service.CATALOG)
        async def mismatch(_context, _params):
            return CallToolResult(structuredContent=correct, content=[TextContent(text='{"result":"OTHER"}')])
        with patch.object(service, "call_tool", mismatch):
            r = await local_run(scenario_script("distance"))
        self.assertEqual((r["reason"], r["receipts_rejected"]), ("unaccepted_mcp_receipt", 1))

    async def test_changed_contract_stops_before_a_provider_request(self):
        original = service.list_tools
        async def changed(context, params):
            listing = await original(context, params)
            listing.tools[0].input_schema["additionalProperties"] = True
            return listing
        with patch.object(service, "list_tools", changed):
            r = await local_run(scenario_script("distance"))
        self.assertEqual((r["reason"], r["provider_requests_attempted"], r["mcp_call_attempts"]), ("discovery_or_contract_changed", 0, 0))

    async def test_server_description_does_not_replace_the_hosts_allowed_instructions(self):
        original, seen = service.list_tools, []
        async def injected(context, params):
            listing = await original(context, params)
            listing.tools[0].description = "SYNTHETIC_UPLOAD_PRIVATE_NOTES_INSTRUCTION"
            return listing
        with patch.object(service, "list_tools", injected):
            r = await local_run(scenario_script("distance"), seen=seen)
        self.assertEqual(r["status"], "answered")
        self.assertNotIn("SYNTHETIC_UPLOAD_PRIVATE_NOTES_INSTRUCTION", json.dumps(seen))
        self.assertNotIn("SYNTHETIC_UPLOAD_PRIVATE_NOTES_INSTRUCTION", json.dumps(r))

    async def test_empty_match_and_request_exhaustion_are_not_task_correctness(self):
        empty = (await run_scenario("empty"))["report"]
        self.assertEqual(empty["observations"][0]["output"]["result"]["count"], 0)
        self.assertFalse(empty["answer_fact_checked"])
        r = await local_run(scenario_script("repeating"), max_requests=2)
        self.assertEqual((r["status"], r["provider_requests_attempted"], r["mcp_call_attempts"], r["receipts_accepted"]), ("budget_exhausted", 2, 2, 2))
        self.assertIsNone(r["answer"])

    async def test_cancellation_retains_prior_accepted_read_and_propagates(self):
        run, arrived, seen = BridgeRun(load_catalog()), asyncio.Event(), []
        async def hold(_payload):
            if len(seen) == 2:
                arrived.set(); await asyncio.Event().wait()
        async with provider_for(scenario_script("distance"), seen, hold) as provider, Client(service.make_server()) as mcp:
            task = asyncio.create_task(run.run(provider, mcp, "offline-fixture-model", "PUBLIC FIXTURE QUESTION"))
            await asyncio.wait_for(arrived.wait(), timeout=5)
            task.cancel()
            with self.assertRaises(asyncio.CancelledError):
                await task
        self.assertEqual((run.report["status"], run.report["receipts_accepted"], run.report["mcp_call_attempts"]), ("cancelled", 1, 1))
        self.assertEqual(len(run.report["observations"]), 1); self.assertIsNone(run.report["answer"])

    async def test_invalid_budgets_and_single_use_do_not_start_extra_work(self):
        for value in (0, 9, True, 1.5):
            with self.assertRaises(ValueError):
                BridgeRun(load_catalog(), max_calls=value)
        run = BridgeRun(load_catalog())
        async with provider_for(scenario_script("distance")) as provider, Client(service.make_server()) as mcp:
            await run.run(provider, mcp, "offline-fixture-model", "PUBLIC FIXTURE QUESTION")
            with self.assertRaises(ValueError):
                await run.run(provider, mcp, "offline-fixture-model", "PUBLIC FIXTURE QUESTION")


if __name__ == "__main__":
    print("Actual SDKs; authored in-memory provider, real local stdio plus separate in-process fault injection. No live model or grading.")
    unittest.main(verbosity=2)
