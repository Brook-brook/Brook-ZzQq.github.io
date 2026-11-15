"""Original Brook application contract; Python3.11+ stdlib, no execution API.

This deliberately accepts one small teaching sum, not arbitrary JSON Schema.
Parsing and validation do not prove permission, source truth or task usefulness.
"""
import json
import math

MAX_JSON_BYTES = 2048


class ContractError(ValueError):
    """A fixed diagnostic code, never an echo of an arbitrary input document."""


def analyze_json_request(text):
    if type(text) is not str:
        raise ContractError("text_required")
    try:
        size = len(text.encode("utf-8"))
    except UnicodeError:
        raise ContractError("invalid_unicode") from None
    if size > MAX_JSON_BYTES:
        raise ContractError("document_too_large")

    def unique_names(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ContractError("duplicate_name")
            result[key] = value
        return result

    def reject_constant(_):
        raise ContractError("nonstandard_number")

    try:
        data = json.loads(text, object_pairs_hook=unique_names,
                          parse_constant=reject_constant)
    except ContractError:
        raise
    except (json.JSONDecodeError, RecursionError, ValueError):
        raise ContractError("json_syntax") from None
    if type(data) is not dict:
        raise ContractError("object_required")
    if set(data) != {"schema_version", "task", "values"}:
        raise ContractError("fields")
    if type(data["schema_version"]) is not int or data["schema_version"] != 1:
        raise ContractError("version")
    if data["task"] != "sum" or type(data["task"]) is not str:
        raise ContractError("task")
    values = data["values"]
    if type(values) is not list or not 1 <= len(values) <= 8:
        raise ContractError("values")
    if not all(type(n) in (int, float) and -1000 <= n <= 1000 and math.isfinite(n)
               for n in values):
        raise ContractError("number")
    return {"schema_version": 1, "kind": "teaching-sum",
            "input_count": len(values), "total": sum(values)}
