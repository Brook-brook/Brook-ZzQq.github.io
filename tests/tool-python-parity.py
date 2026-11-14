"""Cross-language tool contract checks; no model, socket, credentials or real POIs."""
from copy import deepcopy
import importlib.util
import json
import math
from pathlib import Path
import random
import subprocess
import sys
import unittest

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("atlas_agent_example", ROOT / "assets/examples/agent_loop.py")
example = importlib.util.module_from_spec(spec)
spec.loader.exec_module(example)
CATALOG = {"version": 1, "checked": "2026-11-02", "license": "ODbL-1.0", "coordinateSystem": "WGS84",
           "attribution": "Original synthetic test fixture only", "note": "Not real campus data; no source URL is fetched", "places": []}

def place(identifier, coordinate, category="library"):
    return {"id": identifier, "name": "合成图书馆" if category == "library" else "合成教学点", "english": "Synthetic Library" if category == "library" else "Synthetic Teaching",
            "category": category, "tags": [category, "study"], "coordinates": coordinate, "osm": "way/" + str(100 + ord(identifier[0])), "source": "https://mapcarta.com/W" + str(100 + ord(identifier[0]))}

class ToolParity(unittest.TestCase):
    def compare(self, catalog, calls):
        before = deepcopy(catalog)
        completed = subprocess.run(["node", str(ROOT / "tests/tool-python-bridge.mjs")], input=json.dumps({"catalog": catalog, "calls": calls}), text=True, capture_output=True, check=True, timeout=15, cwd=ROOT)
        js = json.loads(completed.stdout)
        py = [example.execute_read_tool(call, example.catalog_snapshot(catalog)) for call in calls]
        def equal(a, b, field=""):
            if field == "distance_m":
                self.assertTrue(math.isclose(a, b, rel_tol=0, abs_tol=1e-6), (a, b)); return
            if isinstance(a, dict):
                self.assertEqual(set(a), set(b))
                for key in a: equal(a[key], b[key], key)
            elif isinstance(a, list):
                self.assertEqual(len(a), len(b))
                for x, y in zip(a, b): equal(x, y)
            else: self.assertEqual(a, b)
        equal(js, py); self.assertEqual(catalog, before)
        return py

    def test_seeded_valid_distances_radius_and_sources_match_without_rounding_membership(self):
        rng = random.Random(20261114)
        catalog = deepcopy(CATALOG)
        catalog["places"] = [place(chr(97 + i), [120.065 + rng.random() * .03, 30.295 + rng.random() * .02], "library" if i % 2 == 0 else "teaching") for i in range(8)]
        ids = [p["id"] for p in catalog["places"]]
        calls = [{"name": "measure_distance", "arguments": {"from": a, "to": b}} for a in ids for b in ids]
        calls += [{"name": "nearby_places", "arguments": {"center": a, "radius_m": radius}} for a in ids for radius in [0, 50, 200, 1000, 3000]]
        result = self.compare(catalog, calls)
        self.assertEqual(result[0]["result"]["distance_m"], 0)
        self.assertTrue(all(item["catalog_size"] == 8 and item["source_checked"] == "2026-11-02" for item in result))

    def test_equal_position_ids_zero_radius_and_ascii_ties_stay_distinct(self):
        catalog = deepcopy(CATALOG); catalog["places"] = [place("c", [120.07, 30.3]), place("b", [120.07, 30.3]), place("a", [120.07, 30.3])]
        result = self.compare(catalog, [{"name": "nearby_places", "arguments": {"center": "c", "radius_m": 0}}])
        self.assertEqual([p["id"] for p in result[0]["result"]["places"]], ["a", "b"])

    def test_meridional_analytic_distance_and_clear_sides_of_the_raw_boundary(self):
        catalog = deepcopy(CATALOG); catalog["places"] = [place("a", [120.07, 30.3]), place("b", [120.07, 30.31])]
        expected = 6371008.8 * math.pi / 18000
        result = self.compare(catalog, [{"name": "measure_distance", "arguments": {"from": "a", "to": "b"}},
                                     {"name": "nearby_places", "arguments": {"center": "a", "radius_m": expected - .001}},
                                     {"name": "nearby_places", "arguments": {"center": "a", "radius_m": expected + .001}}])
        self.assertAlmostEqual(result[0]["result"]["distance_m"], expected, places=7)
        self.assertEqual(result[1]["result"]["count"], 0); self.assertEqual(result[2]["result"]["count"], 1)

    def test_declared_literal_search_and_category_tag_scopes_match(self):
        catalog = deepcopy(CATALOG); catalog["places"] = [place("a", [120.07, 30.3]), place("b", [120.07, 30.31], "teaching")]
        calls = [{"name": "find_places", "arguments": {"query": query, "category": category}} for query in ["图书馆", "ＳＹＮＴＨＥＴＩＣ", " Library ", "学习空间", "不存在", "<img src=x>"] for category in ["all", "study", "library", "teaching", "dining"]]
        result = self.compare(catalog, calls)
        self.assertEqual(result[0]["result"]["count"], 1)
        self.assertEqual(result[3]["result"]["count"], 0)

if __name__ == "__main__": unittest.main(verbosity=2)
