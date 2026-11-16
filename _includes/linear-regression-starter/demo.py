"""Run original finite teaching cases. Actual complete records, never fixtures."""
import argparse
import json
from pathlib import Path

from gradient import load_data, train

CASES = {
    "first": ([0.05], {"w": 0, "b": 0}),
    "stable": ([0.05] * 120, {"w": 0, "b": 0}),
    "oscillating": ([0.2] * 15, {"w": 0, "b": 0}),
    "guarded": ([0.5] * 120, {"w": 0, "b": 0}),
    "mixed": ([0.01] + [0.08] * 10, {"w": -1, "b": 2}),
}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--case", choices=[*CASES, "all"], default="first")
    args = parser.parse_args()
    data = load_data(Path(__file__).with_name("samples.json"))
    for name in CASES if args.case == "all" else [args.case]:
        rates, initial = CASES[name]
        print(json.dumps({"case": name, **train(data, rates, initial)}, ensure_ascii=False, allow_nan=False))


if __name__ == "__main__":
    main()
