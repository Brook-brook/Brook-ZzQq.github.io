"""Exercise the actual SDK with a strictly in-memory HTTP transport.

Run with the interpreter where openai==3.50.0 is installed. No environment
credentials, real model/server, private inputs or external requests are used.
"""
import importlib.util
import json
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

import httpx2
import openai

spec = importlib.util.spec_from_file_location("atlas_request", Path(__file__).resolve().parents[1] / "assets/examples/ai_request.py")
example = importlib.util.module_from_spec(spec)
sys.dont_write_bytecode = True
spec.loader.exec_module(example)


def fixture(status="completed", content=None):
    return {"id": "resp_offline_fixture", "object": "response", "created_at": 0,
            "status": status, "model": "offline-fixture-model", "error": None,
            "incomplete_details": {"reason": "max_output_tokens"} if status == "incomplete" else None,
            "output": [{"type": "message", "id": "msg_offline_fixture", "role": "assistant", "status": "completed",
                        "content": content if content is not None else [{"type": "output_text", "text": "OFFLINE FIXTURE, not model output.", "annotations": []}]}],
            "parallel_tool_calls": True, "tools": [], "tool_choice": "auto", "metadata": {},
            "usage": {"input_tokens": 4, "output_tokens": 3, "total_tokens": 7}}


class RequestContractTests(unittest.TestCase):
    def client(self, body, status=200, failure=None):
        self.requests = []

        def handle(request):
            # MockTransport executes this handler directly; no socket/real API.
            self.assertEqual(request.url.host, "offline.invalid")
            self.assertEqual(request.url.path, "/v1/responses")
            self.requests.append(json.loads(request.content))
            if failure:
                raise failure("offline simulated failure", request=request)
            return httpx2.Response(status, json=body, headers={"x-request-id": "req_offline_fixture"})

        return openai.OpenAI(api_key="atlas-offline-fixture-not-a-credential",
                             base_url="https://offline.invalid/v1", max_retries=0, timeout=15.0,
                             http_client=httpx2.Client(transport=httpx2.MockTransport(handle)))

    def test_actual_serialization_and_response_fields(self):
        with self.client(fixture()) as client:
            result = example.ask_once(client, "offline-fixture-model", "训练与推理有什么区别？")
        self.assertEqual(result, {"text": "OFFLINE FIXTURE, not model output.", "request_id": "req_offline_fixture"})
        self.assertEqual(len(self.requests), 1)
        self.assertEqual(self.requests[0]["model"], "offline-fixture-model")
        self.assertEqual(self.requests[0]["input"], "训练与推理有什么区别？")
        self.assertIs(self.requests[0]["store"], False)
        self.assertEqual(self.requests[0]["max_output_tokens"], 256)

    def test_incomplete_does_not_pass_as_an_answer(self):
        with self.client(fixture("incomplete")) as client:
            with self.assertRaisesRegex(example.ReplyUnavailable, "not-completed"):
                example.ask_once(client, "offline-fixture-model", "test")

    def test_malformed_sdk_envelope_is_not_trusted(self):
        body = fixture()
        body["output"] = None
        with self.client(body) as client:
            with self.assertRaisesRegex(example.ReplyUnavailable, "malformed-output"):
                example.ask_once(client, "offline-fixture-model", "test")

    def test_refusal_and_empty_are_not_success(self):
        for content, reason in [([{"type": "refusal", "refusal": "OFFLINE FIXTURE refusal"}], "refused"),
                                ([{"type": "output_text", "text": "  ", "annotations": []}], "empty-text")]:
            with self.subTest(reason=reason), self.client(fixture(content=content)) as client:
                with self.assertRaisesRegex(example.ReplyUnavailable, reason):
                    example.ask_once(client, "offline-fixture-model", "test")

    def test_nonmessage_tool_output_does_not_pass_as_text(self):
        body = fixture()
        body["output"] = [{"type": "function_call", "id": "fc_offline", "call_id": "call_offline", "name": "read_catalog", "arguments": "{}", "status": "completed"}]
        with self.client(body) as client:
            with self.assertRaisesRegex(example.ReplyUnavailable, "not-text-only"):
                example.ask_once(client, "offline-fixture-model", "test")

    def test_reasoning_metadata_is_not_mistaken_for_an_answer_or_rejected(self):
        body = fixture()
        body["output"].insert(0, {"type": "reasoning", "id": "rs_offline", "summary": []})
        with self.client(body) as client:
            result = example.ask_once(client, "offline-fixture-model", "test")
        self.assertEqual(result["text"], "OFFLINE FIXTURE, not model output.")

    def test_invalid_input_never_reaches_transport(self):
        with self.client(fixture()) as client:
            for model, question in [("", "x"), ("m", ""), ("m", "x" * 2001), (None, "x"), ("m", 12)]:
                with self.subTest(model=model, length=len(question) if isinstance(question, str) else None), self.assertRaises(ValueError):
                    example.ask_once(client, model, question)
        self.assertEqual(self.requests, [])

    def test_http_failure_keeps_real_sdk_status_id_and_no_retry(self):
        for status, error in [(401, openai.AuthenticationError), (429, openai.RateLimitError), (500, openai.InternalServerError)]:
            with self.subTest(status=status), self.client({"error": {"message": "OFFLINE FIXTURE", "type": "fixture", "code": "fixture"}}, status) as client:
                with self.assertRaises(error) as caught:
                    example.ask_once(client, "offline-fixture-model", "test")
                self.assertEqual(caught.exception.status_code, status)
                self.assertEqual(caught.exception.request_id, "req_offline_fixture")
                self.assertEqual(len(self.requests), 1)

    def test_connection_and_timeout_are_real_sdk_exceptions_without_retry(self):
        for failure, error in [(httpx2.ConnectError, openai.APIConnectionError), (httpx2.ReadTimeout, openai.APITimeoutError)]:
            with self.subTest(failure=failure), self.client(None, failure=failure) as client:
                with self.assertRaises(error):
                    example.ask_once(client, "offline-fixture-model", "test")
                self.assertEqual(len(self.requests), 1)

    def test_missing_configuration_stops_before_client_creation(self):
        with patch.object(example.os, "environ", {}), patch.object(example, "OpenAI") as constructor:
            self.assertEqual(example.main(), 2)
            constructor.assert_not_called()


if __name__ == "__main__":
    print(f"Actual SDK {openai.__version__}; all response text is an offline fixture.")
    unittest.main(verbosity=2)
