"""Original contract checks, not model evaluation, grading or production certification."""
from contextlib import ExitStack
import math
import socket
import unittest
from unittest.mock import patch

from demo_offline import run_scenario


class StarterChecks(unittest.TestCase):
    def setUp(self):
        self.guards = ExitStack()
        self.guards.enter_context(patch.object(socket.socket, "connect", side_effect=AssertionError("No socket permitted in this offline exercise")))
        self.guards.enter_context(patch.object(socket, "create_connection", side_effect=AssertionError("No network fallback permitted")))
        self.addCleanup(self.guards.close)

    def test_real_distance_matches_an_independent_spherical_formula(self):
        result = run_scenario()
        report = result["report"]
        self.assertIs(result["model_called"], False)
        self.assertEqual((report["status"], report["requests_attempted"], report["dispatch_attempts"]), ("answered", 2, 1))
        self.assertIs(report["answer_fact_checked"], False)
        points = {p["id"]: p["coordinates"] for p in report["source"]["places"]}
        lon1, lat1 = map(math.radians, points["main-library"])
        lon2, lat2 = map(math.radians, points["medical-library"])
        dot = math.sin(lat1) * math.sin(lat2) + math.cos(lat1) * math.cos(lat2) * math.cos(lon2 - lon1)
        reference = 6371008.8 * math.acos(min(1, max(-1, dot)))
        observed = report["observations"][0]
        self.assertEqual(observed["call_id"], "distance_1")
        self.assertAlmostEqual(observed["output"]["result"]["distance_m"], reference, delta=.001)
        self.assertEqual(report["source"]["checked"], "2026-11-02")
        self.assertEqual(report["source"]["license"], "ODbL-1.0")

    def test_batch_has_two_dispatches_but_one_proposal_response(self):
        result = run_scenario("batch")
        report = result["report"]
        self.assertEqual((result["sdk_exchanges"], report["requests_attempted"], report["dispatch_attempts"]), (2, 2, 2))
        self.assertEqual([o["call_id"] for o in report["observations"]], ["distance_1", "nearby_1"])

    def test_partial_budget_retains_only_work_that_happened(self):
        report = run_scenario("batch", max_dispatches=1)["report"]
        self.assertEqual(report["status"], "budget_exhausted")
        self.assertEqual(report["reason"], "dispatch_budget_partial_work_retained")
        self.assertEqual((report["requests_attempted"], report["dispatch_attempts"], len(report["observations"])), (1, 1, 1))
        self.assertIsNone(report["answer"])

    def test_forbidden_tool_and_wrong_type_stop_before_dispatch(self):
        for scenario in ("forbidden", "wrong-type"):
            with self.subTest(scenario=scenario):
                report = run_scenario(scenario)["report"]
                self.assertEqual((report["status"], report["reason"]), ("failed", "invalid_tool_calls"))
                self.assertEqual(report["dispatch_attempts"], 0)
                self.assertEqual(report["observations"], [])
                self.assertIsNone(report["answer"])

    def test_empty_catalog_match_is_not_reality_absence(self):
        report = run_scenario("empty")["report"]
        self.assertEqual(report["status"], "answered")
        self.assertEqual(report["observations"][0]["output"]["result"]["count"], 0)
        self.assertIs(report["answer_fact_checked"], False)
        self.assertIn("SCRIPTED FIXTURE", report["answer"])
        self.assertEqual(len(report["source"]["places"]), 6)

    def test_repeated_new_calls_stop_at_request_budget(self):
        report = run_scenario("repeating", max_requests=2)["report"]
        self.assertEqual((report["status"], report["reason"]), ("budget_exhausted", "request_budget_no_final_answer"))
        self.assertEqual((report["requests_attempted"], report["dispatch_attempts"]), (2, 2))
        self.assertIsNone(report["answer"])


if __name__ == "__main__":
    print("Real SDK + authored in-memory HTTP fixtures. Six contract checks; no model score.")
    unittest.main(verbosity=2)
