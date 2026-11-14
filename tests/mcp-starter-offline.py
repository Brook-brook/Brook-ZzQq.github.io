"""Actual extracted MCP artifact/CLI checks; requires its pinned SDK, no model."""
from importlib.util import find_spec
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import zipfile

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]


class ExtractedMCP(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="brook-extracted-mcp-")
        self.addCleanup(self.temp.cleanup)
        with zipfile.ZipFile(ROOT / "assets/examples/mcp-starter.zip") as archive:
            self.assertEqual(len(archive.infolist()), 13)
            self.assertTrue(all(name.startswith("brooks-mcp-starter/") and ".." not in name.split("/") for name in archive.namelist()))
            archive.extractall(self.temp.name)
        self.project = Path(self.temp.name) / "brooks-mcp-starter"
        self.env = {"PATH": str(Path(sys.executable).parent), "PYTHONDONTWRITEBYTECODE": "1",
                    "OPENAI_API_KEY": "SYNTHETIC_ENV_NOT_A_CREDENTIAL", "OPENAI_BASE_URL": "https://unused.invalid"}

    def run_project(self, *args):
        return subprocess.run([sys.executable, *args], cwd=self.project, env=self.env, capture_output=True, text=True, timeout=30)

    def test_exact_payload_and_standard_library_component(self):
        result = subprocess.run([sys.executable, str(ROOT / "tools/check-mcp-package.py")], env=self.env, capture_output=True, text=True, timeout=15)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("isolated standard-library tools", result.stdout)

    def test_actual_in_process_and_stdio_six_contract_checks(self):
        self.assertIsNone(find_spec("openai"), "Use the MCP-only test environment to prove model-SDK independence")
        result = self.run_project("run_checks.py")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("Ran 6 tests", result.stderr)
        self.assertIn("OK", result.stderr)

    def test_real_cli_modes_and_results(self):
        for mode, protocol, discovered in [("auto", "2026-07-28", True), ("legacy", "2025-11-25", False)]:
            with self.subTest(mode=mode):
                result = self.run_project("client_check.py", "--mode", mode)
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                value = json.loads(result.stdout)
                self.assertEqual(value["protocol_version"], protocol)
                self.assertIs(value["discovery_received"], discovered)
                self.assertIs(value["model_called"], False)
                self.assertEqual(value["transport"], "local stdio")
                self.assertEqual(value["tools"], ["find_places", "measure_distance", "nearby_places"])
                self.assertAlmostEqual(value["public_cases"][0]["output"]["result"]["distance_m"], 1020.225507, delta=.001)
                self.assertTrue(all(row["is_error"] for row in value["rejected_cases"]))
                self.assertNotIn("SYNTHETIC_ENV_NOT_A_CREDENTIAL", result.stdout + result.stderr)
                self.assertNotIn("unused.invalid", result.stdout + result.stderr)

    def test_unoffered_mode_is_not_silently_treated_as_verified(self):
        result = self.run_project("client_check.py", "--mode", "2025-06-18")
        self.assertEqual(result.returncode, 2)
        self.assertEqual(result.stdout, "")
        self.assertIn("invalid choice", result.stderr)


if __name__ == "__main__":
    print("Actual SDK2.3.0, public ZIP/CLI and synthetic environment; no model/remote host.")
    unittest.main(verbosity=2)
