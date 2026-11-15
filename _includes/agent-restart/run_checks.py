"""Actual temporary-file/child-process checks, not a model or durability score."""
from concurrent.futures import ThreadPoolExecutor
import sqlite3
from pathlib import Path
import tempfile
import unittest
from demo_restart import SCENARIOS, run_scenario, run_worker, run_observer
from receiver import initialize, apply_operation, lookup_operation, inspect_database, UNKNOWN_EXIT


class RestartChecks(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory(prefix="brook-restart-check-")
        self.addCleanup(self.directory.cleanup)
        self.path = Path(self.directory.name) / "owned.sqlite"
        initialize(self.path)

    def test_actual_six_scenarios_have_independent_effect_oracles(self):
        expected = [(2, 1, "replayed"), (2, 1, "applied"), (2, 1, "found"),
                    (2, 1, "conflict"), (3, 2, "applied"), (3, 2, "found")]
        for scenario, wanted in zip(SCENARIOS, expected):
            result = run_scenario(*scenario)
            observed = result["teaching_observer"][-1]
            self.assertEqual((observed["value"], observed["effects"], result["client_trace"][-1]["outcome"]), wanted)
            self.assertFalse(result["model_called"])
            self.assertEqual(result["client_trace"][0]["outcome"], "applied" if result["scenario"] == "historical-receipt" else "unknown")

    def test_real_exit_after_commit_reopens_and_replays_one_effect(self):
        missing = run_worker(self.path, "apply", "op-1", 2, "after_commit")
        self.assertEqual(missing["process_exit_code"], UNKNOWN_EXIT)
        self.assertFalse(missing["reply_received"])
        self.assertIsNone(missing["response"])
        self.assertEqual(run_observer(self.path)["value"], 2)
        missing_again = run_worker(self.path, "apply", "op-1", 2, "after_commit")
        self.assertEqual(missing_again["outcome"], "unknown", 'a replay receipt can also be lost')
        self.assertEqual(inspect_database(self.path)["effects"], 1)
        replay = run_worker(self.path, "apply", "op-1", 2)
        self.assertEqual(replay["outcome"], "replayed")
        self.assertEqual(inspect_database(self.path)["effects"], 1)

    def test_real_exit_before_commit_leaves_no_committed_effect(self):
        missing = run_worker(self.path, "apply", "op-1", 2, "before_commit")
        self.assertEqual(missing["outcome"], "unknown")
        self.assertEqual(missing["process_exit_code"], UNKNOWN_EXIT)
        self.assertEqual(run_observer(self.path), {"value": 0, "effects": 0, "receipts": []})
        applied = run_worker(self.path, "apply", "op-1", 2)
        self.assertEqual(applied["outcome"], "applied")
        self.assertEqual(inspect_database(self.path)["value"], 2)

    def test_exception_between_effect_and_commit_rolls_back_both_tables(self):
        def fail():
            raise RuntimeError("Original injected before-commit failure")
        with self.assertRaises(RuntimeError):
            apply_operation(self.path, "op-1", 2, before_commit=fail)
        self.assertEqual(inspect_database(self.path), {"value": 0, "effects": 0, "receipts": []})
        self.assertEqual(apply_operation(self.path, "op-1", 2)["status"], "applied")
        with self.assertRaises(RuntimeError):
            apply_operation(self.path, "op-2", 1, after_commit=fail)
        self.assertEqual((inspect_database(self.path)["value"], inspect_database(self.path)["effects"]), (3, 2), 'an exception after COMMIT cannot roll back the committed effect')

    def test_lookup_and_conflict_preserve_historical_receipt(self):
        apply_operation(self.path, "op-1", 2)
        self.assertEqual(apply_operation(self.path, "op-1", 3), {"status": "conflict", "receipt": None})
        apply_operation(self.path, "op-2", 1)
        receipt = lookup_operation(self.path, "op-1", 2)
        self.assertEqual(receipt["receipt"]["value_after"], 2)
        self.assertEqual(inspect_database(self.path)["value"], 3)
        receipt["receipt"]["units"] = 3
        self.assertEqual(lookup_operation(self.path, "op-1", 2)["receipt"]["units"], 2)
        self.assertEqual(lookup_operation(self.path, "op-1", 3), {"status": "conflict", "receipt": None})

    def test_existing_database_and_bad_input_are_never_silently_reset(self):
        apply_operation(self.path, "op-1", 2)
        raw = self.path.read_bytes()
        with self.assertRaises(FileExistsError):
            initialize(self.path)
        for key, units in (("other", 2), ("op-1", True), ("op-1", "2"), ("op-1", 0), ("op-1", 4)):
            with self.assertRaises(ValueError):
                apply_operation(self.path, key, units)
        self.assertEqual(self.path.read_bytes(), raw)
        with self.assertRaises(sqlite3.OperationalError):
            inspect_database(Path(self.directory.name) / "missing.sqlite")
        self.assertFalse((Path(self.directory.name) / "missing.sqlite").exists())

    def test_two_independent_processes_same_key_apply_once(self):
        with ThreadPoolExecutor(max_workers=2) as workers:
            replies = list(workers.map(lambda _: run_worker(self.path, "apply", "op-1", 2), range(2)))
        self.assertEqual({row["outcome"] for row in replies}, {"applied", "replayed"})
        self.assertEqual((inspect_database(self.path)["value"], inspect_database(self.path)["effects"]), (2, 1))

    def test_wrong_version_or_inconsistent_receipt_is_not_repaired(self):
        apply_operation(self.path, "op-1", 2)
        connection = sqlite3.connect(self.path)
        try:
            connection.execute("UPDATE receipt SET units=3 WHERE operation_key='op-1'")
            connection.commit()
        finally:
            connection.close()
        with self.assertRaises(ValueError):
            lookup_operation(self.path, "op-1", 2)
        connection = sqlite3.connect(self.path)
        try:
            connection.execute("PRAGMA user_version=2")
            connection.commit()
        finally:
            connection.close()
        with self.assertRaises(ValueError):
            inspect_database(self.path)


if __name__ == "__main__":
    unittest.main(verbosity=2)
