"""Run five actual bounded lexical-search cases; no model or network request."""
import argparse
import json
from pathlib import Path
from vectors import create_vector_run, read_json, vector_report

CASES = {
    "retention": {"query": "保留 空间", "weighting": "tfidf", "version": "all", "k": 2},
    "count": {"query": "保留 空间", "weighting": "count", "version": "all", "k": 2},
    "version": {"query": "保留 空间", "weighting": "tfidf", "version": "v2", "k": 2},
    "gap": {"query": "7天", "weighting": "tfidf", "version": "all", "k": 2},
    "repeat": {"query": "保留 保留 空间", "weighting": "tfidf", "version": "all", "k": 2},
}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--case", choices=[*CASES, "all"], default="retention")
    parser.add_argument("--query", help="Explicit query override; stored only in the printed report")
    arguments = parser.parse_args()
    root = Path(__file__).resolve().parent
    corpus = read_json((root / "corpus.json").read_text(encoding="utf-8"))
    registry = read_json((root / "registry.json").read_text(encoding="utf-8"))
    for name in CASES if arguments.case == "all" else [arguments.case]:
        settings = dict(CASES[name])
        if arguments.query is not None:
            settings["query"] = arguments.query
        record = vector_report(create_vector_run(corpus, registry, settings))
        print(json.dumps(record, ensure_ascii=False, allow_nan=False, separators=(",", ":")))


if __name__ == "__main__":
    main()
