"""Original public inputs shared by the browser and stdlib CLI, not model output."""
JSON_CASES = (
    ("valid", '{"schema_version":1,"task":"sum","values":[1,2,3]}'),
    ("bool-is-not-a-number", '{"schema_version":1,"task":"sum","values":[1,true]}'),
    ("duplicate-name", '{"schema_version":1,"task":"sum","task":"sum","values":[1]}'),
    ("nonstandard-number", '{"schema_version":1,"task":"sum","values":[NaN]}'),
)


def evaluate_examples(analyze, contract_error):
    """Use an actual supplied function; return its real result or fixed code."""
    rows = []
    for name, text in JSON_CASES:
        try:
            rows.append({"case": name, "accepted": True, "result": analyze(text)})
        except contract_error as error:
            rows.append({"case": name, "accepted": False, "error": str(error)})
    return rows
