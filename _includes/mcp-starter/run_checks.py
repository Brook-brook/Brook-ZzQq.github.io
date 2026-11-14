"""Original actual-SDK MCP contract tests; injections are tests, not model output."""
from copy import deepcopy
import json
import math
import unittest
from unittest.mock import patch

from mcp import Client
from mcp.types import TextContent
import server as service
from client_check import check_stdio, verify_output


class MCPChecks(unittest.IsolatedAsyncioTestCase):
    async def test_real_discovery_and_three_explicit_schemas(self):
        async with Client(service.make_server()) as client:
            self.assertEqual(client.protocol_version, "2026-07-28")
            self.assertIsNotNone(client.session.discover_result)
            self.assertEqual(client.server_info.name, service.SERVER_NAME)
            self.assertIsNone(client.server_capabilities.resources)
            self.assertIsNone(client.server_capabilities.prompts)
            rows = (await client.list_tools()).tools
            self.assertEqual([row.name for row in rows], ["find_places", "measure_distance", "nearby_places"])
            required = {"find_places": {"query", "category"}, "measure_distance": {"from", "to"}, "nearby_places": {"center", "radius_m"}}
            for row in rows:
                self.assertEqual(set(row.input_schema["required"]), required[row.name])
                self.assertIs(row.input_schema["additionalProperties"], False)
                self.assertIs(row.annotations.read_only_hint, True)
                self.assertEqual(row.output_schema["type"], "object")

    async def test_invalid_calls_never_reach_actual_dispatch(self):
        invalid = [("publish_notes", {}), ("measure_distance", {"from": "main-library", "to": "unknown"}),
                   ("measure_distance", {"from": "main-library"}),
                   ("measure_distance", {"from": "main-library", "to": "medical-library", "url": "https://not-used.invalid"}),
                   ("nearby_places", {"center": "main-library", "radius_m": "200"}),
                   ("nearby_places", {"center": "main-library", "radius_m": True}),
                   ("nearby_places", {"center": "main-library", "radius_m": 3001}),
                   ("find_places", {"query": " ", "category": "all"}),
                   ("find_places", {"query": "🌍" * 41, "category": "all"})]
        with patch.object(service, "execute_read_tool", wraps=service.execute_read_tool) as dispatch:
            async with Client(service.make_server()) as client:
                for name, arguments in invalid:
                    with self.subTest(name=name, arguments=arguments):
                        result = await client.call_tool(name, arguments)
                        self.assertIs(result.is_error, True)
                        self.assertIsNone(result.structured_content)
                self.assertEqual(dispatch.call_count, 0)
                accepted = await client.call_tool("find_places", {"query": "🌍" * 40, "category": "all"})
                self.assertFalse(accepted.is_error)
                self.assertEqual(dispatch.call_count, 1)

    async def test_actual_results_and_returned_data_are_owned(self):
        async with Client(service.make_server()) as client:
            first = await client.call_tool("measure_distance", {"from": "main-library", "to": "medical-library"})
            value = verify_output(first)
            self.assertAlmostEqual(value["result"]["distance_m"], 1020.225507, delta=.001)
            self.assertEqual(value["coordinate_system"], "WGS84")
            value["result"]["from"]["coordinates"][0] = 0
            second = verify_output(await client.call_tool("measure_distance", {"from": "main-library", "to": "medical-library"}))
            self.assertEqual(second["result"]["from"]["coordinates"][0], 120.07561)
            zero = verify_output(await client.call_tool("nearby_places", {"center": "main-library", "radius_m": 0}))
            self.assertEqual(zero["result"]["count"], 0)
            self.assertEqual(zero["source_checked"], "2026-11-02")

    async def test_output_schema_rejects_bad_shape_but_does_not_certify_facts(self):
        with patch.object(service, "execute_read_tool", return_value={"result": {}}):
            async with Client(service.make_server()) as client:
                with self.assertRaisesRegex(RuntimeError, "Invalid structured content"):
                    await client.call_tool("measure_distance", {"from": "main-library", "to": "medical-library"})
        wrong = service.execute_read_tool({"name": "measure_distance", "arguments": {"from": "main-library", "to": "medical-library"}}, service.CATALOG)
        wrong["result"]["distance_m"] = 999
        with patch.object(service, "execute_read_tool", return_value=deepcopy(wrong)):
            async with Client(service.make_server()) as client:
                result = await client.call_tool("measure_distance", {"from": "main-library", "to": "medical-library"})
                self.assertFalse(result.is_error)
                self.assertEqual(verify_output(result)["result"]["distance_m"], 999)
                self.assertGreater(abs(result.structured_content["result"]["distance_m"] - 1020.225507), .001)
                # A valid shape/flag did not establish the numeric fact.

    async def test_actual_stdio_default_auto_negotiates_modern_protocol(self):
        result = await check_stdio()
        self.assertEqual(result["transport"], "local stdio")
        self.assertEqual(result["protocol_version"], "2026-07-28")
        self.assertTrue(result["discovery_received"])
        self.assertFalse(result["model_called"])
        self.assertEqual(len(result["public_cases"]), 3)
        self.assertTrue(all(row["is_error"] for row in result["rejected_cases"]))

    async def test_actual_stdio_legacy_is_explicit_not_a_new_protocol_claim(self):
        result = await check_stdio("legacy")
        self.assertEqual(result["protocol_version"], "2025-11-25")
        self.assertFalse(result["discovery_received"])
        self.assertEqual(result["server_info"]["name"], service.SERVER_NAME)


if __name__ == "__main__":
    print("Actual MCP SDK2.3.0: in-process validation and real stdio subprocesses; no model or remote endpoint.")
    unittest.main(verbosity=2)
