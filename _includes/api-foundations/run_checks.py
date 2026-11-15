"""Actual stdlib contract and loopback-HTTP checks; no SDK, model or external URL."""
import http.client
import json
import math
import unittest
from concurrent.futures import ThreadPoolExecutor
from copy import deepcopy
from unittest.mock import patch
from json_contracts import analyze_json_request, decode_json_document, ContractError, MAX_JSON_BYTES
from http_client import request_case, CASE_NAMES
from http_fixtures import fixture_server
from delivery_http import DeliveryHandler, delivery_server, request_delivery, public_receiver_snapshot
from effect_model import new_receiver, apply_effect, lookup_effect
from demo_delivery import SCENARIOS, run_scenario


def document(values, **changes):
    data = {"schema_version": 1, "task": "sum", "values": values}
    data.update(changes)
    return json.dumps(data, separators=(",", ":"))


class ContractChecks(unittest.TestCase):
    def rejected(self, text, code):
        with self.assertRaises(ContractError) as caught:
            analyze_json_request(text)
        self.assertEqual(str(caught.exception), code)

    def test_independent_small_sum_reference(self):
        for count in range(1, 9):
            got = analyze_json_request(document(list(range(1, count + 1))))
            self.assertEqual(got["total"], count * (count + 1) // 2)
            self.assertEqual(got["input_count"], count)
        self.assertEqual(analyze_json_request(document([-1000, 1000]))["total"], 0)
        self.assertTrue(math.isclose(analyze_json_request(document([0.1, 0.2]))["total"], 0.3))

    def test_bool_and_string_are_not_numeric_inputs(self):
        for value in (True, False, "2", None, {}, []):
            self.rejected(document([value]), "number")

    def test_shape_and_exact_field_set(self):
        for text in ("[]", "null", "true", "1", '"hello"'):
            self.rejected(text, "object_required")
        for text in ('{}', '{"schema_version":1,"task":"sum"}', document([1], extra="SYNTHETIC_UNUSED")):
            self.rejected(text, "fields")

    def test_no_version_or_task_coercion(self):
        for version in (True, 1.0, "1", 2, None):
            self.rejected(document([1], schema_version=version), "version")
        for task in (None, 1, [], "SUM", "shell", "sum "):
            self.rejected(document([1], task=task), "task")

    def test_list_size_and_number_limits(self):
        for values in ([], [0] * 9, None, "123", {"0": 1}):
            self.rejected(document(values), "values")
        for value in (-1001, 1001, 10 ** 1800):
            self.rejected(document([value]), "number")

    def test_duplicate_names_rejected_even_if_values_match(self):
        self.rejected('{"schema_version":1,"task":"sum","task":"sum","values":[1]}', "duplicate_name")
        self.rejected('{"x":{"a":1,"a":2}}', "duplicate_name")

    def test_nonstandard_numbers_and_overflow_have_distinct_causes(self):
        for value in ("NaN", "Infinity", "-Infinity"):
            self.rejected('{"schema_version":1,"task":"sum","values":[' + value + ']}', "nonstandard_number")
        self.rejected('{"schema_version":1,"task":"sum","values":[1e309]}', "number")

    def test_byte_limit_exact_boundary_and_unicode(self):
        raw = document([1])
        full = raw + " " * (MAX_JSON_BYTES - len(raw.encode("utf-8")))
        self.assertEqual(analyze_json_request(full)["total"], 1)
        self.rejected(full + " ", "document_too_large")
        self.rejected('"' + "😀" * 520 + '"', "document_too_large")
        self.rejected("\ud800", "invalid_unicode")

    def test_syntax_not_python_evaluation(self):
        for raw in ("", "{'x':1}", "[1,]", '__import__("os")', "{" * 1000):
            self.rejected(raw, "json_syntax")
        self.rejected(b"{}", "text_required")

    def test_parse_result_is_not_application_acceptance(self):
        self.assertIs(decode_json_document("true"), True)
        self.assertIsNone(decode_json_document("null"))
        self.assertEqual(decode_json_document("[1,2]"), [1, 2])
        self.rejected("true", "object_required")


class HTTPChecks(unittest.TestCase):
    def test_actual_http_matrix_and_exact_one_request_per_case(self):
        expected = {
            "valid": (200, "computed", None),
            "bad-json": (200, "json", "json_syntax"),
            "wrong-type": (200, "contract", "number"),
            "wrong-media": (200, "representation", "media_type"),
            "no-content": (204, "http", "expected_json_absent"),
            "rate-limit": (429, "http", "rate_limited"),
            "unavailable": (503, "http", "unavailable"),
            "redirect": (302, "http", "http_status"),
            "too-large": (200, "representation", "document_too_large"),
            "disconnect": (None, "transport", "transport_error"),
            "timeout": (None, "transport", "timeout"),
        }
        with fixture_server() as server:
            for case in CASE_NAMES:
                row = request_case(server.server_port, case, timeout=0.1 if case == "timeout" else 1)
                self.assertEqual((row["http_status"], row["stage"], row["error"]), expected[case], case)
                self.assertEqual(row["http_requests_attempted"], 1)
                self.assertFalse(row["model_called"])
                self.assertLessEqual(row["body_bytes_read"], MAX_JSON_BYTES + 1)
                if case == "valid":
                    self.assertEqual(row["result"]["total"], 6)
                else:
                    self.assertIsNone(row["result"])
                if case in {"rate-limit", "unavailable"}:
                    self.assertEqual(row["retry_after"], "5")
            # The302 fixture redirects to valid; there must be no extra request.
            with server.count_lock:
                self.assertEqual(server.request_paths, ["/cases/" + c for c in CASE_NAMES])

    def test_204_has_no_body_or_content_length(self):
        with fixture_server() as server:
            connection = http.client.HTTPConnection("127.0.0.1", server.server_port, timeout=1)
            try:
                connection.request("GET", "/cases/no-content")
                response = connection.getresponse()
                self.assertEqual(response.status, 204)
                self.assertIsNone(response.getheader("Content-Length"))
                self.assertEqual(response.read(), b"")
            finally:
                connection.close()

    def test_unsupported_input_never_reaches_fixture(self):
        with fixture_server() as server:
            for args in ((True, "valid"), (0, "valid"), (65536, "valid"), (server.server_port, []), (server.server_port, "https://example.invalid")):
                with self.assertRaises(ValueError):
                    request_case(*args)
            for timeout in (True, 0, float("inf"), float("nan"), 10 ** 1800):
                with self.assertRaises(ValueError):
                    request_case(server.server_port, "valid", timeout=timeout)
            with server.count_lock:
                self.assertEqual(server.request_paths, [])


class DeliveryChecks(unittest.TestCase):
    def test_real_http_loss_retry_and_reconcile_cases(self):
        expected = [(4, 2, "confirmed"), (2, 1, "confirmed"), (2, 1, "confirmed"),
                    (2, 1, "conflict"), (4, 2, "confirmed"), (2, 1, "confirmed")]
        for case, wanted in zip(SCENARIOS, expected):
            result = run_scenario(*case)
            receiver = result["teaching_observer"]["receiver"]
            self.assertEqual((receiver["value"], receiver["writes"], result["client_trace"][-1]["outcome"]), wanted)
            self.assertEqual(result["client_trace"][0]["outcome"], "unknown")
            self.assertIsNone(result["client_trace"][0]["receipt"])
            self.assertTrue(all(row["http_requests_attempted"] == 1 for row in result["client_trace"]))
        self.assertEqual(run_scenario(*SCENARIOS[-1])["teaching_observer"]["write_requests_received"], 1)

    def test_real_concurrent_identical_key_is_serialized_by_receiver(self):
        with delivery_server("keyed", "none") as server:
            with ThreadPoolExecutor(max_workers=2) as workers:
                results = list(workers.map(lambda _: request_delivery(server.server_port, "op-1", 2), range(2)))
            self.assertEqual({row["response_kind"] for row in results}, {"applied", "replayed"})
            self.assertEqual(public_receiver_snapshot(server)["receiver"]["value"], 2)
            self.assertEqual(public_receiver_snapshot(server)["receiver"]["writes"], 1)
            self.assertEqual(public_receiver_snapshot(server)["write_requests_received"], 2)

    def test_real_lookup_receipt_is_historical_and_bound_to_expected_payload(self):
        with delivery_server("keyed", "none") as server:
            request_delivery(server.server_port, "op-1", 2)
            request_delivery(server.server_port, "op-2", 1)
            receipt = request_delivery(server.server_port, "op-1", 2, lookup=True)
            self.assertEqual(receipt["receipt"]["value_after"], 2)
            self.assertEqual(public_receiver_snapshot(server)["receiver"]["value"], 3)
            mismatch = request_delivery(server.server_port, "op-1", 3, lookup=True)
            self.assertEqual(mismatch["outcome"], "conflict")
            self.assertIsNone(mismatch["receipt"])
            self.assertEqual(public_receiver_snapshot(server)["receiver"]["writes"], 2)

    def test_actual_receiver_rejects_bad_document_before_effect(self):
        with delivery_server("keyed", "none") as server:
            for body in ('{"units":true}', '{"units":1,"units":2}', '{"units":2,"extra":"SYNTHETIC_UNUSED"}'):
                connection = http.client.HTTPConnection("127.0.0.1", server.server_port, timeout=1)
                try:
                    connection.request("POST", "/trial/add", body=body, headers={"Content-Type": "application/json", "Idempotency-Key": "op-1"})
                    response = connection.getresponse()
                    self.assertEqual(response.status, 400)
                    self.assertEqual(json.loads(response.read()), {"status": "invalid_request", "receipt": None})
                finally:
                    connection.close()
            self.assertEqual(public_receiver_snapshot(server)["receiver"]["writes"], 0)

    def test_real_malformed_receipt_is_not_accepted_even_after_effect(self):
        # Original altered server replies travel through real HTTP sockets. The
        # client is not mocked, and refusal must not erase the receiver's effect.
        for fault in ("wrong_role", "wrong_key", "wrong_units", "bool_value", "charset", "duplicate_media", "encoding"):
            with self.subTest(fault=fault):
                def malformed(handler, response):
                    value = deepcopy(response)
                    if fault == "wrong_role":
                        value["status"] = "found"
                    elif fault == "wrong_key":
                        value["receipt"]["key"] = "op-2"
                    elif fault == "wrong_units":
                        value["receipt"]["units"] = 3
                    elif fault == "bool_value":
                        value["receipt"]["value_after"] = True
                    raw = json.dumps(value, allow_nan=False).encode("utf-8")
                    handler.send_response(200)
                    handler.send_header("Content-Type", "application/json; charset=iso-8859-1" if fault == "charset" else "application/json")
                    if fault == "duplicate_media":
                        handler.send_header("Content-Type", "application/json")
                    if fault == "encoding":
                        handler.send_header("Content-Encoding", "gzip")
                    handler.send_header("Content-Length", str(len(raw)))
                    handler.send_header("Connection", "close")
                    handler.end_headers()
                    handler.wfile.write(raw)
                    handler.close_connection = True
                with patch.object(DeliveryHandler, "reply", malformed), delivery_server("keyed", "none") as server:
                    row = request_delivery(server.server_port, "op-1", 2)
                    self.assertEqual(row["http_status"], 200)
                    self.assertIsNone(row["receipt"])
                    self.assertEqual(row["outcome"], "conflict" if fault in {"wrong_key", "wrong_units"} else "unknown")
                    self.assertEqual(public_receiver_snapshot(server)["receiver"]["value"], 2)

    def test_plain_receiver_bound_and_keyed_reply_copies(self):
        receiver = new_receiver("plain")
        for _ in range(6):
            receiver, _ = apply_effect(receiver, "op-1", 1)
        stopped, response = apply_effect(receiver, "op-1", 1)
        self.assertEqual(response["status"], "write_limit")
        self.assertEqual(stopped["value"], 6)
        keyed, _ = apply_effect(new_receiver("keyed"), "op-1", 2)
        reply = lookup_effect(keyed, "op-1", 2)
        reply["receipt"]["units"] = 3
        self.assertEqual(keyed["receipts"][0]["units"], 2)

    def test_receiver_rejects_coercion_and_unknown_fields(self):
        for key, units in (("op-1", True), ("op-1", "2"), ("op-1", 0), ("op-1", 4), ("unknown", 2)):
            with self.assertRaises(ValueError):
                apply_effect(new_receiver("keyed"), key, units)
        bad = new_receiver("keyed")
        bad["extra"] = "SYNTHETIC_UNUSED"
        with self.assertRaises(ValueError):
            apply_effect(bad, "op-1", 1)


if __name__ == "__main__":
    unittest.main(verbosity=2)
