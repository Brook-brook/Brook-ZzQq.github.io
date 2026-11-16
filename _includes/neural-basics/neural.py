"""Original manual2->2->1 forward/backward teaching example, stdlib only.

No autograd engine, optimizer, fitted XOR model, external service or private data.
Four authored logical XOR examples are reused for explanation, never a test set.
"""
import json
import math

PARAMETER_KEYS = ("w00", "w01", "w10", "w11", "b0", "b1", "v0", "v1", "c")
PARAMETERS = {"w00": -0.4, "w01": 0.6, "w10": 0.7, "w11": -0.2,
              "b0": 0.1, "b1": -0.1, "v0": 0.8, "v1": -0.5, "c": 0.2}
EXAMPLES = (("xor-00", (-1, -1), 0), ("xor-01", (-1, 1), 1),
            ("xor-10", (1, -1), 1), ("xor-11", (1, 1), 0))


def checked_parameters(value):
    if type(value) is not dict or set(value) != set(PARAMETER_KEYS):
        raise ValueError("exact_nine_parameters")
    if not all(type(v) in (int, float) and abs(v) <= 4 and math.isfinite(v) for v in value.values()):
        raise ValueError("finite_parameters_within_four")
    return dict(value)


def sigmoid(value):
    if value >= 0:
        return 1 / (1 + math.exp(-value))
    exp_value = math.exp(value)
    return exp_value / (1 + exp_value)


def forward(inputs, parameters, activation="tanh"):
    p = checked_parameters(parameters)
    if (type(inputs) not in (list, tuple) or len(inputs) != 2 or
            not all(type(x) in (int, float) and abs(x) <= 2 and math.isfinite(x) for x in inputs)):
        raise ValueError("two_finite_inputs_within_two")
    if activation not in ("tanh", "identity"):
        raise ValueError("hidden_activation")
    z = [p[f"w{j}0"] * inputs[0] + p[f"w{j}1"] * inputs[1] + p[f"b{j}"] for j in range(2)]
    hidden = [math.tanh(value) if activation == "tanh" else value for value in z]
    logit = p["v0"] * hidden[0] + p["v1"] * hidden[1] + p["c"]
    return {"inputs": list(inputs), "hidden_preactivation": z, "hidden": hidden,
            "logit": logit, "probability": sigmoid(logit)}


def binary_loss(logit, target):
    if (type(logit) not in (int, float) or abs(logit) > 1e6 or not math.isfinite(logit) or
            type(target) is not int or target not in (0, 1)):
        raise ValueError("finite_logit_and_binary_target")
    # Stable unweighted binary cross-entropy, rather than log(0) clipping.
    return max(logit, 0) - target * logit + math.log1p(math.exp(-abs(logit)))


def evaluate(parameters=None, activation="tanh"):
    """Compute current values and fresh mean-loss gradients, without updating."""
    p = checked_parameters(PARAMETERS if parameters is None else parameters)
    rows = []
    n = len(EXAMPLES)
    for name, inputs, target in EXAMPLES:
        trace = forward(inputs, p, activation)
        delta_out = trace["probability"] - target
        slopes = [1 - a*a if activation == "tanh" else 1 for a in trace["hidden"]]
        contributions = {"c": delta_out / n}
        for j in range(2):
            delta_hidden = delta_out * p[f"v{j}"] * slopes[j]
            contributions[f"v{j}"] = delta_out * trace["hidden"][j] / n
            contributions[f"b{j}"] = delta_hidden / n
            for k in range(2):
                contributions[f"w{j}{k}"] = delta_hidden * inputs[k] / n
        rows.append({"id": name, "target": target, **trace,
                     "binary_cross_entropy": binary_loss(trace["logit"], target),
                     "mean_gradient_contribution": {key: contributions[key] for key in p},
                     "chain_w00": [delta_out, p["v0"], slopes[0], inputs[0], 1/n]})
    return {"schema_version": 1, "kind": "brook-neural-chain-rule",
            "architecture": [2, 2, 1], "hidden_activation": activation,
            "parameters": p, "parameters_updated": False, "external_model_service": False,
            "mean_binary_cross_entropy": math.fsum(row["binary_cross_entropy"] for row in rows) / n,
            "mean_gradient": {key: math.fsum(row["mean_gradient_contribution"][key] for row in rows) for key in p},
            "rows": rows,
            "scope": "Original logical XOR worked examples, all repeatedly visible. Manual forward and "
                     "chain-rule derivatives only; no optimizer, trained classifier, independent test, "
                     "automatic differentiation framework, LLM or learning achievement."}


def demo():
    for activation in ("tanh", "identity"):
        print(json.dumps(evaluate(activation=activation), ensure_ascii=False, allow_nan=False))
