"""Actual independent equation, isolation and boundary checks, not grades."""
from copy import deepcopy
from fractions import Fraction
import json
import math
from pathlib import Path
import tempfile
import unittest

from gradient import derivative, load_data, mse, reference, train, validated_data

DATA = load_data(Path(__file__).with_name("samples.json"))


class GradientChecks(unittest.TestCase):
    def test_unknown_fields_and_numeric_types(self):
        for field, bad in (("x", True), ("x", "1"), ("y", float("inf")), ("x", 10**500), ("y", 16)):
            value = deepcopy(DATA)
            value["samples"][0][field] = bad
            with self.assertRaises(ValueError):
                validated_data(value)
        value = deepcopy(DATA)
        value["private_note"] = "synthetic"
        with self.assertRaises(ValueError):
            validated_data(value)

    def test_sample_count_ids_and_roles(self):
        for edit in (lambda d: d["samples"].pop(),
                     lambda d: d["samples"][1].update(id=d["samples"][0]["id"]),
                     lambda d: d["samples"][0].update(split="validation"),
                     lambda d: d.update(schema_version=True)):
            value = deepcopy(DATA)
            edit(value)
            with self.assertRaises(ValueError):
                validated_data(value)

    def test_constant_training_features_rejected(self):
        value = deepcopy(DATA)
        for row in value["samples"]:
            if row["split"] == "train":
                row["x"] = 1
        with self.assertRaises(ValueError):
            validated_data(value)

    def test_reference_matches_independent_fraction_normal_equations(self):
        points = [(Fraction(str(r["x"])), Fraction(str(r["y"]))) for r in DATA["samples"] if r["split"] == "train"]
        n = len(points)
        sx, sy = sum(x for x, _ in points), sum(y for _, y in points)
        xx, xy = sum(x*x for x, _ in points), sum(x*y for x, y in points)
        w = (n*xy-sx*sy)/(n*xx-sx*sx)
        b = (sy-w*sx)/n
        self.assertEqual((w, b), (Fraction(99, 50), Fraction(17, 16)))
        exact_loss = sum((w*x+b-y)**2 for x, y in points)/n
        self.assertEqual(exact_loss, Fraction(1339, 32000))
        actual = reference(DATA)
        self.assertAlmostEqual(actual["parameters"]["w"], float(w))
        self.assertAlmostEqual(actual["parameters"]["b"], float(b))
        self.assertAlmostEqual(actual["training_mse"], float(exact_loss))
        self.assertEqual(actual["hessian_largest_eigenvalue"], 15)
        self.assertAlmostEqual(actual["constant_rate_upper_bound"], 2/15)

    def test_first_update_from_old_parameters(self):
        frame = train(DATA, [0.05])["run"]["history"][1]
        self.assertEqual(frame["before"], {"w": 0, "b": 0})
        self.assertAlmostEqual(frame["gradient"]["w"], -29.7)
        self.assertAlmostEqual(frame["gradient"]["b"], -2.125)
        self.assertAlmostEqual(frame["parameters"]["w"], 1.485)
        self.assertAlmostEqual(frame["parameters"]["b"], 0.10625)

    def test_gradient_matches_finite_difference(self):
        points = [r for r in DATA["samples"] if r["split"] == "train"]
        initial, h = {"w": -0.7, "b": 1.3}, 1e-5
        actual = derivative(points, initial)
        for key in initial:
            left, right = dict(initial), dict(initial)
            left[key] -= h
            right[key] += h
            self.assertAlmostEqual(actual[key], (mse(points, right)-mse(points, left))/(2*h), places=6)

    def test_validation_changes_only_validation_losses(self):
        value = deepcopy(DATA)
        for row in value["samples"]:
            if row["split"] == "validation":
                row["y"] += 1
        for rate in (0.05, 0.5):
            a, b = train(DATA, [rate]*120)["run"], train(value, [rate]*120)["run"]
            self.assertEqual(a["stop"], b["stop"])
            self.assertEqual(a["rejected"], b["rejected"])
            for fa, fb in zip(a["history"], b["history"], strict=True):
                self.assertEqual({k: v for k, v in fa.items() if k != "validation_mse"},
                                 {k: v for k, v in fb.items() if k != "validation_mse"})
            self.assertNotEqual(a["history"][-1]["validation_mse"], b["history"][-1]["validation_mse"])
        self.assertEqual(reference(DATA), reference(value))

    def test_numeric_guard_preserves_last_applied_state(self):
        result = train(DATA, [0.5]*120)["run"]
        self.assertEqual(result["stop"], "numeric_limit")
        last, rejected = result["history"][-1], result["rejected"]
        n = last["iteration"]
        self.assertTrue(math.isclose(last["parameters"]["w"], 1.98*(1-(-6.5)**n), rel_tol=1e-12))
        self.assertEqual(rejected["iteration"], n+1)
        self.assertTrue(abs(rejected["proposed_parameters"]["w"]) > 1e6 or rejected["proposed_training_mse"] > 1e12)
        self.assertLessEqual(last["training_mse"], 1e12)
        json.dumps(result, allow_nan=False)

    def test_finite_budget_and_stable_descent(self):
        result = train(DATA, [0.05]*120)["run"]
        self.assertEqual(result["stop"], "update_budget")
        self.assertIsNone(result["rejected"])
        self.assertEqual(len(result["history"]), 121)
        losses = [r["training_mse"] for r in result["history"]]
        self.assertTrue(all(a >= b-1e-12 for a, b in zip(losses, losses[1:])))
        self.assertAlmostEqual(result["history"][-1]["parameters"]["w"], 1.98, places=6)

    def test_mixed_rates_and_owned_snapshots(self):
        value, initial = deepcopy(DATA), {"w": -1, "b": 2}
        result = train(value, [0.01]+[0.08]*10, initial)
        value["samples"][0]["y"] = 15
        initial["w"] = 5
        self.assertEqual(result["run"]["initial"], {"w": -1, "b": 2})
        self.assertEqual(result["run"]["data"], DATA)
        self.assertEqual([r["learning_rate"] for r in result["run"]["history"]][1:], [0.01]+[0.08]*10)
        self.assertIsNone(result["run"]["stop"])
        self.assertIs(result["external_model_service"], False)

    def test_invalid_schedule_and_initial_values(self):
        for rates in ([True], ["0.05"], [0], [0.501], [float("nan")], [0.05]*121, (0.05,)):
            with self.assertRaises(ValueError):
                train(DATA, rates)
        for initial in ({"w": 11, "b": 0}, {"w": 0, "b": False}, {"w": 0}, {"w": 0, "b": 0, "extra": 1}):
            with self.assertRaises(ValueError):
                train(DATA, [], initial)
        self.assertEqual(len(train(DATA, [])["run"]["history"]), 1)

    def test_bounded_strict_local_json_loader(self):
        with tempfile.TemporaryDirectory(prefix="brook-gradient-data-") as directory:
            path = Path(directory)/"sample.json"
            for text in ('{"x":1,"x":2}', '{"x":NaN}', ' '*16001, '{"bad":1}', '\udcff'):
                path.write_bytes(text.encode("utf-8", errors="surrogatepass"))
                with self.assertRaises((ValueError, UnicodeError)):
                    load_data(path)
            path.write_text(json.dumps(DATA), encoding="utf-8")
            self.assertEqual(load_data(path), DATA)


if __name__ == "__main__":
    unittest.main(verbosity=2)
