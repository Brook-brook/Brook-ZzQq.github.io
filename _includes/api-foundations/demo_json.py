"""Run four actual JSON cases; no model, socket or private input."""
import json
from json_contracts import analyze_json_request, ContractError
from json_cases import evaluate_examples

for row in evaluate_examples(analyze_json_request, ContractError):
    print(json.dumps(row, allow_nan=False))
