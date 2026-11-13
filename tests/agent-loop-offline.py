"""Actual openai3.50.0 SDK, strictly fake in-memory HTTP responses; no live model."""
from copy import deepcopy
import importlib.util
import io
from contextlib import redirect_stdout
import json
import math
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

import httpx2
import openai

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("atlas_agent_example", Path(__file__).resolve().parents[1] / "assets/examples/agent_loop.py")
example = importlib.util.module_from_spec(spec)
spec.loader.exec_module(example)

# Synthetic unit fixture inside the catalog's numeric region; never public POIs.
CATALOG = {"version": 1, "checked": "2026-11-02", "coordinateSystem": "WGS84", "license": "ODbL-1.0",
           "attribution": "Synthetic unit fixture only", "note": "Not real campus data", "places": [
               {"id": "a", "name": "甲图书馆", "english": "Alpha Library", "category": "library", "tags": ["library", "study"], "coordinates": [120.07, 30.30], "osm": "way/1", "source": "https://mapcarta.com/W1"},
               {"id": "b", "name": "乙图书馆", "english": "Beta Library", "category": "library", "tags": ["library"], "coordinates": [120.07, 30.31], "osm": "way/2", "source": "https://mapcarta.com/W2"},
               {"id": "c", "name": "教学点", "english": "Teaching Point", "category": "teaching", "tags": ["teaching"], "coordinates": [120.07, 30.301], "osm": "way/3", "source": "https://mapcarta.com/W3"}]}


def call(identifier, name, args):
    return {"type": "function_call", "id": "fc_" + identifier, "call_id": identifier,
            "name": name, "arguments": json.dumps(args) if isinstance(args, dict) else args, "status": "completed"}


def response(items=None, status="completed"):
    return {"id": "resp_offline", "object": "response", "created_at": 0, "status": status, "model": "offline-fixture-model",
            "output": items if items is not None else [{"type": "message", "id": "msg_offline", "role": "assistant", "status": "completed",
                                                         "content": [{"type": "output_text", "text": "OFFLINE FIXTURE, not model output.", "annotations": []}]}],
            "parallel_tool_calls": True, "tools": [], "tool_choice": "auto", "metadata": {},
            "usage": {"input_tokens": 4, "output_tokens": 3, "total_tokens": 7}}


class AgentContractTests(unittest.TestCase):
    def client(self, responses, failure=None, before=None):
        self.requests = []
        queue = list(responses)
        def handle(request):
            self.assertEqual(request.url.host, "offline.invalid")
            self.assertEqual(request.url.path, "/v1/responses")
            self.requests.append(json.loads(request.content))
            if before:
                before(len(self.requests))
            if failure:
                raise failure("offline fixture", request=request)
            self.assertTrue(queue, "No unplanned extra requests or real transport")
            item = queue.pop(0)
            body, status = item if isinstance(item, tuple) else (item, 200)
            return httpx2.Response(status, json=body, headers={"x-request-id": f"req_offline_{len(self.requests)}"})
        return openai.OpenAI(api_key="offline-fixture-not-a-credential", base_url="https://offline.invalid/v1", max_retries=0, timeout=15.0,
                             http_client=httpx2.Client(transport=httpx2.MockTransport(handle), trust_env=False))

    def run_example(self, client, **kwargs):
        return example.run_agent(client, "offline-fixture-model", "PRIVATE_QUESTION_SENTINEL", CATALOG, **kwargs)

    def test_real_sdk_continuation_retains_call_ids_results_and_source(self):
        first = response([call("call_a", "find_places", {"query": "图书馆", "category": "library"})])
        second = response([call("call_b", "measure_distance", {"from": "a", "to": "b"})])
        with self.client([first, second, response()]) as client:
            result = self.run_example(client)
        self.assertEqual(result["status"], "answered")
        self.assertFalse(result["answer_fact_checked"])
        self.assertEqual(result["requests_attempted"], 3)
        self.assertEqual(result["dispatch_attempts"], 2)
        self.assertAlmostEqual(result["observations"][1]["output"]["result"]["distance_m"], 6371008.8 * math.pi / 18000, places=7)
        self.assertEqual(result["answer"], "OFFLINE FIXTURE, not model output.")
        self.assertEqual(result["source"]["license"], "ODbL-1.0")
        second_input = self.requests[1]["input"]
        returned = next(item for item in second_input if item.get("type") == "function_call_output")
        self.assertEqual(returned["call_id"], "call_a")
        self.assertEqual(json.loads(returned["output"])["result"]["count"], 2)
        self.assertIs(self.requests[0]["store"], False)
        self.assertEqual(self.requests[0]["include"], ["reasoning.encrypted_content"])
        self.assertNotIn("PRIVATE_QUESTION_SENTINEL", json.dumps(result["trace"]))

    def test_reasoning_context_is_forwarded_without_becoming_a_public_trace(self):
        reasoning = {"type": "reasoning", "id": "rs_offline", "summary": [], "encrypted_content": "OFFLINE_ENCRYPTED_FIXTURE"}
        with self.client([response([reasoning, call("call_a", "find_places", {"query": "图书馆", "category": "all"})]), response()]) as client:
            result = self.run_example(client)
        self.assertEqual(result["status"], "answered")
        self.assertTrue(any(item.get("encrypted_content") == "OFFLINE_ENCRYPTED_FIXTURE" for item in self.requests[1]["input"]))
        self.assertNotIn("OFFLINE_ENCRYPTED_FIXTURE", json.dumps(result))
        self.assertNotIn("history", result)

    def test_batch_has_one_response_and_two_actual_dispatches_before_text(self):
        items = [call("call_a", "measure_distance", {"from": "a", "to": "b"}), call("call_b", "nearby_places", {"center": "a", "radius_m": 200})]
        with self.client([response(items), response()]) as client:
            result = self.run_example(client)
        self.assertEqual(result["requests_attempted"], 2)
        self.assertEqual(result["dispatch_attempts"], 2)
        self.assertEqual([p["id"] for p in result["observations"][1]["output"]["result"]["places"]], ["c"])

    def test_partial_batch_budget_retains_work_and_does_not_fabricate_final_answer(self):
        items = [call("call_a", "measure_distance", {"from": "a", "to": "b"}), call("call_b", "nearby_places", {"center": "a", "radius_m": 200})]
        with self.client([response(items)]) as client:
            result = self.run_example(client, max_dispatches=1)
        self.assertEqual(result["status"], "budget_exhausted")
        self.assertEqual(result["dispatch_attempts"], 1)
        self.assertEqual(len(result["observations"]), 1)
        self.assertIsNone(result["answer"])
        self.assertEqual(len(self.requests), 1)

    def test_request_budget_stops_repeated_new_calls_without_a_final_answer(self):
        fixtures = [response([call(f"call_{i}", "find_places", {"query": "图书馆", "category": "all"})]) for i in range(2)]
        with self.client(fixtures) as client:
            result = self.run_example(client, max_requests=2)
        self.assertEqual(result["status"], "budget_exhausted")
        self.assertEqual(result["reason"], "request_budget_no_final_answer")
        self.assertEqual(result["requests_attempted"], 2)
        self.assertEqual(result["dispatch_attempts"], 2)

    def test_unknown_tool_duplicate_json_keys_nan_wrong_types_and_ids_never_dispatch(self):
        invalid = [call("bad", "publish_notes", {}), call("bad", "nearby_places", '{"center":"a","radius_m":1,"radius_m":2}'),
                   call("bad", "nearby_places", '{"center":"a","radius_m":NaN}'), call("bad", "nearby_places", {"center": "a", "radius_m": True}),
                   call("bad", "measure_distance", {"from": "a", "to": "invented"}), call("bad", "find_places", {"query": "a", "category": "all", "url": "https://not-used.test"})]
        for item in invalid:
            with self.subTest(item=item), self.client([response([item])]) as client:
                result = self.run_example(client)
                self.assertEqual(result["status"], "failed")
                self.assertEqual(result["reason"], "invalid_tool_calls")
                self.assertEqual(result["dispatch_attempts"], 0)

    def test_entire_batch_is_checked_before_first_dispatch(self):
        items = [call("call_a", "measure_distance", {"from": "a", "to": "b"}), call("call_b", "publish_notes", {})]
        with self.client([response(items)]) as client:
            result = self.run_example(client)
        self.assertEqual(result["dispatch_attempts"], 0)
        self.assertEqual(result["observations"], [])

    def test_duplicate_ids_namespaced_async_or_program_calls_are_not_silently_executed(self):
        original = call("same_id", "find_places", {"query": "图书馆", "category": "all"})
        for patch in [{"namespace": "other"}, {"async": True}, {"caller": {"type": "program", "caller_id": "program_offline"}}, {"status": "incomplete"}]:
            with self.subTest(patch=patch), self.client([response([{**original, **patch}])]) as client:
                self.assertEqual(self.run_example(client)["dispatch_attempts"], 0)
        with self.client([response([original, original])]) as client:
            self.assertEqual(self.run_example(client)["dispatch_attempts"], 0)
        with self.client([response([original]), response([original])]) as client:
            result = self.run_example(client)
        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["dispatch_attempts"], 1)

    def test_incomplete_refusal_empty_and_unknown_output_stay_distinct(self):
        refusal = response([{"type": "message", "id": "msg_refusal", "role": "assistant", "status": "completed", "content": [{"type": "refusal", "refusal": "OFFLINE FIXTURE"}]}])
        empty = response(); empty["output"] = []
        unknown = response([{"type": "fixture_unknown", "id": "unknown_offline"}])
        for body, status in [(response(status="incomplete"), "failed"), (refusal, "refused"), (empty, "failed"), (unknown, "failed")]:
            with self.subTest(status=status, body=body), self.client([body]) as client:
                result = self.run_example(client)
                self.assertEqual(result["status"], status)
                self.assertIsNone(result["answer"])

    def test_api_failures_and_timeouts_use_real_sdk_exceptions_without_retry(self):
        for status in [401, 429, 500]:
            with self.subTest(status=status), self.client([({"error": {"message": "OFFLINE FIXTURE"}}, status)]) as client:
                result = self.run_example(client)
                self.assertEqual(result["reason"], "api_status")
                self.assertEqual(result["trace"][0]["status"], status)
                self.assertEqual(len(self.requests), 1)
        for failure in [httpx2.ConnectError, httpx2.ReadTimeout]:
            with self.subTest(failure=failure), self.client([], failure=failure) as client:
                self.assertEqual(self.run_example(client)["reason"], "connection_or_timeout")
                self.assertEqual(len(self.requests), 1)

    def test_catalog_snapshot_is_owned_even_when_input_changes_between_responses(self):
        catalog = deepcopy(CATALOG)
        def change(_):
            catalog["places"][0]["coordinates"][0] = 0
        with self.client([response([call("call_a", "measure_distance", {"from": "a", "to": "b"})]), response()], before=change) as client:
            result = example.run_agent(client, "offline-fixture-model", "fixture question", catalog)
        self.assertEqual(result["source"]["places"][0]["coordinates"][0], 120.07)
        self.assertAlmostEqual(result["observations"][0]["output"]["result"]["distance_m"], 6371008.8 * math.pi / 18000, places=7)

    def test_invalid_catalog_or_budgets_fail_before_any_request(self):
        bad = deepcopy(CATALOG); bad["places"][0]["coordinates"][0] = 0
        with self.client([]) as client:
            for kwargs in [{"catalog": bad}, {"max_requests": True}, {"max_dispatches": 0}, {"max_requests": 9}]:
                args = {"catalog": CATALOG, **kwargs}
                with self.subTest(kwargs=kwargs), self.assertRaises(ValueError):
                    example.run_agent(client, "offline-fixture-model", "fixture question", **args)
        self.assertEqual(self.requests, [])

    def test_cli_requires_configuration_before_constructing_a_client(self):
        with patch.object(example.os, "environ", {}), patch.object(example.sys, "argv", ["agent_loop.py", "fixture", "--catalog", "unused.json"]), patch.object(example, "OpenAI") as factory:
            with self.assertRaises(SystemExit) as stopped:
                example.main()
            self.assertEqual(stopped.exception.code, 2)
            factory.assert_not_called()

    def test_cli_rejects_oversize_catalog_before_constructing_a_client(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "public-fixture.json"
            path.write_bytes(b"x" * (256 * 1024 + 1))
            with patch.object(example.os, "environ", {"OPENAI_MODEL": "offline-fixture-model", "OPENAI_API_KEY": "offline-fixture-not-a-credential"}), patch.object(example.sys, "argv", ["agent_loop.py", "fixture", "--catalog", str(path)]), patch.object(example, "OpenAI") as factory:
                self.assertEqual(example.main(), 2)
                factory.assert_not_called()

    def test_downloaded_cli_wiring_runs_with_the_actual_sdk_fake_transport(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "public-fixture.json"
            path.write_text(json.dumps(CATALOG), encoding="utf-8")
            output = io.StringIO()
            with self.client([response()]) as client:
                with patch.object(example.os, "environ", {"OPENAI_MODEL": "offline-fixture-model", "OPENAI_API_KEY": "offline-fixture-not-a-credential"}), patch.object(example.sys, "argv", ["agent_loop.py", "fixture", "--catalog", str(path)]), patch.object(example, "OpenAI", return_value=client), redirect_stdout(output):
                    self.assertEqual(example.main(), 0)
            result = json.loads(output.getvalue())
            self.assertEqual(result["status"], "answered")
            self.assertFalse(result["answer_fact_checked"])
            self.assertEqual(result["answer"], "OFFLINE FIXTURE, not model output.")


if __name__ == "__main__":
    print(f"Actual SDK {openai.__version__}; every provider response is a labelled offline fixture.")
    unittest.main(verbosity=2)
