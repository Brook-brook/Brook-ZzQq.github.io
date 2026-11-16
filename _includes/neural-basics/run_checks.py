"""Check every manual gradient against an independent numeric loss derivative."""
from copy import deepcopy
import math
import unittest

from neural import PARAMETERS, EXAMPLES, binary_loss, evaluate, forward


class NeuralChecks(unittest.TestCase):
    def test_all_nine_gradients_for_both_hidden_activations(self):
        # Re-evaluate the scalar loss at perturbed parameters, not the analytic
        # chain factors. These are checks, never a learner/model score.
        h = 1e-6
        for activation in ("tanh", "identity"):
            for initial in (PARAMETERS, {key: value/2+0.1 for key, value in PARAMETERS.items()}):
                actual = evaluate(initial, activation)["mean_gradient"]
                for key in PARAMETERS:
                    left, right = dict(initial), dict(initial)
                    left[key] -= h
                    right[key] += h
                    finite_difference = (evaluate(right, activation)["mean_binary_cross_entropy"] -
                                         evaluate(left, activation)["mean_binary_cross_entropy"]) / (2*h)
                    self.assertAlmostEqual(actual[key], finite_difference, places=7, msg=f"{activation}/{key}")

    def test_identity_layers_collapse_to_one_affine_logit(self):
        p = PARAMETERS
        coefficients = [p["v0"]*p[f"w0{k}"] + p["v1"]*p[f"w1{k}"] for k in range(2)]
        intercept = p["v0"]*p["b0"] + p["v1"]*p["b1"] + p["c"]
        for x in [*[(row[1]) for row in EXAMPLES], (0.2, -0.3), (-1.5, 0.75)]:
            expected = sum(a*b for a, b in zip(coefficients, x, strict=True)) + intercept
            self.assertAlmostEqual(forward(x, p, "identity")["logit"], expected)
        self.assertNotAlmostEqual(forward((1, 1), p, "tanh")["logit"], forward((1, 1), p, "identity")["logit"])

    def test_one_path_and_full_batch_have_distinct_factors(self):
        result = evaluate()
        for row in result["rows"]:
            self.assertAlmostEqual(math.prod(row["chain_w00"]), row["mean_gradient_contribution"]["w00"])
            self.assertEqual(row["chain_w00"][-1], 1/4)
        self.assertAlmostEqual(math.fsum(r["mean_gradient_contribution"]["w00"] for r in result["rows"]), result["mean_gradient"]["w00"])

    def test_all_rows_have_exact_shapes_and_logical_labels(self):
        result = evaluate()
        self.assertEqual(result["architecture"], [2, 2, 1])
        self.assertEqual(len(result["parameters"]), 9)
        self.assertEqual([r["target"] for r in result["rows"]], [0, 1, 1, 0])
        self.assertEqual([r["id"] for r in result["rows"]], ["xor-00", "xor-01", "xor-10", "xor-11"])
        for row in result["rows"]:
            self.assertEqual([len(row[key]) for key in ("inputs", "hidden_preactivation", "hidden")], [2, 2, 2])
            self.assertEqual(set(row["mean_gradient_contribution"]), set(PARAMETERS))
            self.assertTrue(0 < row["probability"] < 1)

    def test_binary_loss_is_stable_at_large_finite_logits(self):
        for logit in (-1000, -50, 0, 50, 1000):
            for target in (0, 1):
                self.assertTrue(math.isfinite(binary_loss(logit, target)))
                self.assertGreaterEqual(binary_loss(logit, target), 0)
        self.assertAlmostEqual(binary_loss(0, 1), math.log(2))
        self.assertAlmostEqual(binary_loss(-1000, 1), 1000)
        for logit, target in ((True, 1), (float("inf"), 0), (1, True), (1, 0.5)):
            with self.assertRaises(ValueError):
                binary_loss(logit, target)

    def test_invalid_parameters_activations_and_input_shapes_fail(self):
        for bad in (True, "1", float("nan"), float("inf"), 4.01, 10**500):
            p = dict(PARAMETERS)
            p["w00"] = bad
            with self.assertRaises(ValueError):
                evaluate(p)
        for x in ([1], [1, 2, 3], [True, 1], [3, 1], ["1", 1]):
            with self.assertRaises(ValueError):
                forward(x, PARAMETERS)
        for p in ({}, {**PARAMETERS, "extra": 1}):
            with self.assertRaises(ValueError):
                evaluate(p)
        with self.assertRaises(ValueError):
            evaluate(activation="relu")

    def test_gradients_are_fresh_and_no_parameter_update_occurs(self):
        p = deepcopy(PARAMETERS)
        first, second = evaluate(p), evaluate(p)
        self.assertEqual(first, second)
        self.assertEqual(p, PARAMETERS)
        self.assertIs(first["parameters_updated"], False)
        self.assertIs(first["external_model_service"], False)
        self.assertIn("no optimizer", first["scope"])
        first["parameters"]["w00"] = 0
        first["rows"][0]["inputs"][0] = 0
        self.assertEqual(evaluate(p), second)

    def test_scalar_loss_is_the_mean_of_all_four_explicit_rows(self):
        result = evaluate()
        losses = []
        for _, x, y in EXAMPLES:
            z = forward(x, PARAMETERS)["logit"]
            # Independent probability form is safe for these moderate logits.
            probability = 1/(1+math.exp(-z))
            losses.append(-y*math.log(probability)-(1-y)*math.log1p(-probability))
        self.assertAlmostEqual(result["mean_binary_cross_entropy"], sum(losses)/4)


if __name__ == "__main__":
    unittest.main(verbosity=2)
