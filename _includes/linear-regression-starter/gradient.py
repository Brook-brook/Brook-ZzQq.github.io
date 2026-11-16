"""Original full-batch linear-regression exercise; Python3.11+ stdlib only.

Training and validation are fixed authored teaching partitions, not observations
or a random sample. No network, environment credentials, learner journal or LLM.
"""
from copy import deepcopy
import json
import math
from pathlib import Path
import re

MAX_UPDATES = 120
MAX_PARAMETER = 1e6
MAX_TRAIN_LOSS = 1e12


def number(value, bound):
    return type(value) in (int, float) and abs(value) <= bound and math.isfinite(value)


def fields(value, names):
    return type(value) is dict and set(value) == set(names)


def validated_data(value):
    if not fields(value, ("schema_version", "id", "source_kind", "units", "description", "samples")):
        raise ValueError("data_fields")
    if (type(value["schema_version"]) is not int or value["schema_version"] != 1 or
            value["id"] != "brook-gradient-transect-v1" or value["source_kind"] != "original_synthetic" or
            value["units"] != "abstract" or type(value["description"]) is not str or
            not value["description"].strip() or len(value["description"]) > 400 or
            type(value["samples"]) is not list or len(value["samples"]) != 12):
        raise ValueError("data_contract")
    names, counts = set(), {"train": 0, "validation": 0}
    for row in value["samples"]:
        if not fields(row, ("id", "split", "x", "y")):
            raise ValueError("sample_fields")
        name, split = row["id"], row["split"]
        if (type(name) is not str or not re.fullmatch(r"[tv]-[0-9]{2}", name) or
                type(split) is not str or split not in counts or
                name[0] != ("t" if split == "train" else "v") or name in names or
                not number(row["x"], 5) or not number(row["y"], 15)):
            raise ValueError("sample_contract")
        names.add(name)
        counts[split] += 1
    train = [row for row in value["samples"] if row["split"] == "train"]
    if counts != {"train": 8, "validation": 4}:
        raise ValueError("fixed_split")
    mean_x = math.fsum(row["x"] for row in train) / len(train)
    if math.fsum((row["x"] - mean_x) ** 2 for row in train) <= 1e-8:
        raise ValueError("training_variance")
    return deepcopy(value)


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("duplicate_key")
        result[key] = value
    return result


def reject_constant(_):
    raise ValueError("non_json_constant")


def load_data(path):
    # Local explicit file only. No URL, glob, directory scan or private source.
    with Path(path).open("rb") as source:
        raw = source.read(16001)
    if not 0 < len(raw) <= 16000:
        raise ValueError("data_bytes")
    return validated_data(json.loads(raw.decode("utf-8"), object_pairs_hook=unique_object,
                                     parse_constant=reject_constant))


def mse(points, parameters):
    return math.fsum((parameters["w"] * row["x"] + parameters["b"] - row["y"]) ** 2
                     for row in points) / len(points)


def derivative(train, parameters):
    residuals = [(parameters["w"] * row["x"] + parameters["b"] - row["y"], row["x"])
                 for row in train]
    return {"w": 2 * math.fsum(r * x for r, x in residuals) / len(train),
            "b": 2 * math.fsum(r for r, _ in residuals) / len(train)}


def reference(input_data):
    data = validated_data(input_data)
    train = [row for row in data["samples"] if row["split"] == "train"]
    n = len(train)
    mx = math.fsum(row["x"] for row in train) / n
    my = math.fsum(row["y"] for row in train) / n
    w = math.fsum((row["x"] - mx) * (row["y"] - my) for row in train) / math.fsum(
        (row["x"] - mx) ** 2 for row in train)
    result = {"w": w, "b": my - w * mx}
    a, c = 2 * math.fsum(row["x"] ** 2 for row in train) / n, 2 * mx
    largest = (a + 2 + math.sqrt((a - 2) ** 2 + 4 * c ** 2)) / 2
    return {"parameters": result, "training_mse": mse(train, result),
            "hessian_largest_eigenvalue": largest, "constant_rate_upper_bound": 2 / largest}


def train(input_data, learning_rates, initial=None):
    """Execute a finite schedule, stopping before a rejected numeric proposal.

    No resume/import, optimization by validation, auto-convergence or hidden
    stochastic sampling. All returned frames describe actually applied states.
    """
    data = validated_data(input_data)
    initial = {"w": 0, "b": 0} if initial is None else initial
    if not fields(initial, ("w", "b")) or not all(number(value, 10) for value in initial.values()):
        raise ValueError("initial_parameters")
    if type(learning_rates) is not list or len(learning_rates) > MAX_UPDATES:
        raise ValueError("schedule")
    if not all(number(rate, 0.5) and rate >= 0.001 for rate in learning_rates):
        raise ValueError("learning_rate")
    training = [row for row in data["samples"] if row["split"] == "train"]
    validation = [row for row in data["samples"] if row["split"] == "validation"]
    parameters = deepcopy(initial)
    history = [{"iteration": 0, "parameters": deepcopy(parameters), "learning_rate": None,
                "before": None, "gradient": None, "training_mse": mse(training, parameters),
                "validation_mse": mse(validation, parameters)}]
    rejected = None
    for iteration, rate in enumerate(learning_rates, 1):
        gradient = derivative(training, parameters)
        proposal = {key: parameters[key] - rate * gradient[key] for key in ("w", "b")}
        proposed_loss = mse(training, proposal)
        # Validation labels have no role in the numerical guard.
        if (not all(number(value, MAX_PARAMETER) for value in proposal.values()) or
                not math.isfinite(proposed_loss) or proposed_loss > MAX_TRAIN_LOSS):
            rejected = {"iteration": iteration, "learning_rate": rate, "before": deepcopy(parameters),
                        "gradient": gradient, "proposed_parameters": proposal,
                        "proposed_training_mse": proposed_loss, "reason": "numeric_limit"}
            break
        history.append({"iteration": iteration, "parameters": proposal, "learning_rate": rate,
                        "before": deepcopy(parameters), "gradient": gradient,
                        "training_mse": proposed_loss, "validation_mse": mse(validation, proposal)})
        parameters = proposal
    stop = "numeric_limit" if rejected else "update_budget" if len(history) == MAX_UPDATES + 1 else None
    return {"schema_version": 1, "kind": "brook-gradient-teaching-record",
            "model_kind": "single-feature-linear-regression",
            "optimizer": "full-batch-gradient-descent-on-training-mse",
            "external_model_service": False,
            "run": {"schema_version": 1, "kind": "brook-gradient-run", "data": data,
                    "initial": deepcopy(initial), "history": history, "stop": stop, "rejected": rejected},
            "scope": "Original synthetic full-batch teaching calculation. Validation is repeatedly visible, "
                     "not an independent final test. No real measurements, LLM, remote service or learner grading."}
