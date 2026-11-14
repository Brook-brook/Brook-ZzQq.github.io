"""Verify actual public bridge ZIP/CLI with real SDKs, synthetic environment only."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import zipfile

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]


class ExtractedBridge(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="brook-extracted-bridge-")
        self.addCleanup(self.temp.cleanup)
        with zipfile.ZipFile(ROOT / "assets/examples/agent-mcp-bridge.zip") as archive:
            self.assertEqual(len(archive.infolist()), 16)
            self.assertTrue(all(name.startswith("brooks-agent-mcp-bridge/") and ".." not in name.split("/") for name in archive.namelist()))
            archive.extractall(self.temp.name)
        self.project = Path(self.temp.name) / "brooks-agent-mcp-bridge"
        self.env = {"PATH": str(Path(sys.executable).parent), "PYTHONDONTWRITEBYTECODE": "1",
                    "OPENAI_API_KEY": "SYNTHETIC_ENV_NOT_A_CREDENTIAL", "OPENAI_BASE_URL": "https://unused.invalid"}

    def run_project(self, *args):
        return subprocess.run([sys.executable, *args], cwd=self.project, env=self.env, capture_output=True, text=True, timeout=45)

    def test_source_zip_and_pure_components(self):
        result = subprocess.run([sys.executable, str(ROOT / "tools/check-bridge-package.py")], env=self.env, capture_output=True, text=True, timeout=15)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("no SDK, protocol or model executed", result.stdout)

    def test_extracted_twelve_sdk_contracts(self):
        result = self.run_project("run_checks.py")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("Ran 12 tests", result.stderr); self.assertIn("OK", result.stderr)

    def test_real_cli_scenarios_and_partial_states(self):
        for scenario, requests, calls, status, count in [
            ("distance", 4, 3, "answered", 1), ("batch", 4, 3, "answered", 2),
            ("batch", 4, 1, "budget_exhausted", 1), ("forbidden", 4, 3, "failed", 0),
            ("wrong-type", 4, 3, "failed", 0), ("empty", 4, 3, "answered", 1),
            ("repeating", 2, 3, "budget_exhausted", 2)
        ]:
            with self.subTest(scenario=scenario, requests=requests, calls=calls):
                result = self.run_project("demo_bridge.py", "--scenario", scenario, "--max-requests", str(requests), "--max-calls", str(calls))
                self.assertEqual(result.returncode, 0 if status == "answered" else 1, result.stderr)
                value = json.loads(result.stdout); report = value["report"]
                self.assertFalse(value["model_called"]); self.assertFalse(report["model_called"])
                self.assertEqual(report["status"], status)
                self.assertEqual(report["mcp_call_attempts"], count)
                self.assertEqual(report["receipts_accepted"], count)
                self.assertEqual(value["tool_transport"], "real local stdio")
                self.assertEqual(report["source"]["checked"], "2026-11-02")
                self.assertEqual(report["session"]["protocol_version"], "2026-07-28")
                self.assertNotIn("SYNTHETIC_ENV_NOT_A_CREDENTIAL", result.stdout + result.stderr)
                self.assertNotIn("unused.invalid", result.stdout + result.stderr)

    def test_invalid_budget_is_not_silently_accepted(self):
        result = self.run_project("demo_bridge.py", "--max-calls", "0")
        self.assertEqual(result.returncode, 2); self.assertEqual(result.stdout, "")


if __name__ == "__main__":
    print("Actual SDKs/ZIP/stdio and synthetic environment, authored provider only; no live model.")
    unittest.main(verbosity=2)
