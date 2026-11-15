"""Actual stdlib contract and loopback-HTTP checks; no SDK, model or external URL."""
import http.client
import json
import math
import unittest
from json_contracts import analyze_json_request, ContractError, MAX_JSON_BYTES
from http_client import request_case, CASE_NAMES
from http_fixtures import fixture_server


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


if __name__ == "__main__":
    unittest.main(verbosity=2)
