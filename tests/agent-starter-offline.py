"""Verify the actual public ZIP as a learner receives it; no real account/model."""
from pathlib import Path
import json
import subprocess
import sys
import tempfile
import unittest
import zipfile

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]


class ExtractedStarter(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="brook-downloaded-starter-")
        self.addCleanup(self.temp.cleanup)
        with zipfile.ZipFile(ROOT / "assets/examples/agent-starter.zip") as archive:
            self.assertEqual(len(archive.infolist()), 11)
            self.assertTrue(all(name.startswith("brooks-agent-starter/") and ".." not in name.split("/") for name in archive.namelist()))
            archive.extractall(self.temp.name)
        self.project = Path(self.temp.name) / "brooks-agent-starter"
        self.env = {"PATH": str(Path(sys.executable).parent), "PYTHONDONTWRITEBYTECODE": "1",
                    "OPENAI_API_KEY": "SYNTHETIC_ENV_MUST_NOT_BE_USED", "OPENAI_MODEL": "not-used",
                    "OPENAI_BASE_URL": "https://must-not-connect.invalid"}

    def command(self, *args):
        return subprocess.run([sys.executable, *args], cwd=self.project, env=self.env, capture_output=True, text=True, timeout=20)

    def test_exact_zip_payload_and_manifest_check(self):
        result = subprocess.run([sys.executable, str(ROOT / "tools/build-agent-starter.py"), "--check"], env=self.env, capture_output=True, text=True, timeout=20)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("11 exact bounded entries", result.stdout)

    def test_packaged_six_contract_checks_with_network_connections_forbidden(self):
        result = self.command("run_checks.py")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("Ran 6 tests", result.stderr)
        self.assertIn("OK", result.stderr)

    def test_actual_cli_scenarios_and_partial_work_outputs(self):
        cases = [("distance", [], "answered", 2, 1), ("batch", ["--max-dispatches", "1"], "budget_exhausted", 1, 1),
                 ("forbidden", [], "failed", 1, 0), ("wrong-type", [], "failed", 1, 0),
                 ("empty", [], "answered", 2, 1), ("repeating", ["--max-requests", "2"], "budget_exhausted", 2, 2)]
        for scenario, arguments, status, requests, dispatches in cases:
            with self.subTest(scenario=scenario):
                result = self.command("demo_offline.py", "--scenario", scenario, *arguments)
                self.assertEqual(result.returncode, 0 if status == "answered" else 1, result.stderr)
                output = json.loads(result.stdout); report = output["report"]
                self.assertIs(output["model_called"], False)
                self.assertEqual((report["status"], report["requests_attempted"], report["dispatch_attempts"]), (status, requests, dispatches))
                self.assertEqual(output["sdk_exchanges"], requests)
                self.assertNotIn("SYNTHETIC_ENV_MUST_NOT_BE_USED", result.stdout + result.stderr)
                self.assertNotIn("must-not-connect.invalid", result.stdout + result.stderr)
                if status != "answered": self.assertIsNone(report["answer"])
                self.assertEqual(report["source"]["checked"], "2026-11-02")

    def test_invalid_cli_budget_stops_with_argument_error(self):
        result = self.command("demo_offline.py", "--max-dispatches", "0")
        self.assertEqual(result.returncode, 2)
        self.assertEqual(result.stdout, "")
        self.assertIn("invalid choice", result.stderr)


if __name__ == "__main__":
    print("Actual SDK3.50.0, extracted public ZIP, synthetic environment only; no model or account.")
    unittest.main(verbosity=2)
