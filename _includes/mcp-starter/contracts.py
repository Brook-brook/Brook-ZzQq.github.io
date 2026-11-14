"""Original public catalog/contract definitions; model and protocol independent."""
from copy import deepcopy
import json
from pathlib import Path
from campus_tools import catalog_snapshot, tool_schemas, unique_object

TOOL_NAMES = ("find_places", "measure_distance", "nearby_places")
OUTPUT_SCHEMA = {
    "type": "object",
    "properties": {
        "catalog_version": {"const": 1},
        "source_checked": {"type": "string", "pattern": r"^\d{4}-\d{2}-\d{2}$"},
        "coordinate_system": {"const": "WGS84"},
        "catalog_size": {"type": "integer", "minimum": 1, "maximum": 100},
        "result": {"type": "object"},
    },
    "required": ["catalog_version", "source_checked", "coordinate_system", "catalog_size", "result"],
    "additionalProperties": False,
}


def load_catalog():
    path = Path(__file__).with_name("catalog.json")
    if path.stat().st_size > 256 * 1024:
        raise ValueError("The bundled public catalog is too large")
    return catalog_snapshot(json.loads(path.read_text(encoding="utf-8"), object_pairs_hook=unique_object))


def tool_contracts(catalog):
    definitions = {row["name"]: row for row in tool_schemas(catalog)}
    if set(definitions) != set(TOOL_NAMES):
        raise ValueError("Review the canonical tool set before packaging")
    descriptions = {
        "find_places": "Literal name/category search of this public catalog only; no semantic judgment, opening hours or reality-absence inference.",
        "measure_distance": "Spherical arc between catalog WGS84 representative points, mean radius6371008.8m; not a walking route or ellipsoid geodesic.",
        "nearby_places": "Read only catalog representatives within a raw inclusive0–3000m spherical radius; excludes the center ID and is not full campus coverage.",
    }
    result = {}
    for name in TOOL_NAMES:
        schema = deepcopy(definitions[name]["parameters"])
        if name == "find_places":
            schema["properties"]["query"]["description"] = "Nonblank literal query, at most80 UTF16 code units in this backend. JSON Schema maxLength counts code points; backend validation remains required."
        result[name] = {"name": name, "description": descriptions[name], "input_schema": schema,
                        "output_schema": deepcopy(OUTPUT_SCHEMA)}
    return result
