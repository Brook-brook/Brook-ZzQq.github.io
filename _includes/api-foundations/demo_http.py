"""Run eleven authored cases through actual local HTTP; no external service."""
import json
from http_client import request_case, CASE_NAMES
from http_fixtures import fixture_server

with fixture_server() as server:
    for case in CASE_NAMES:
        row = request_case(server.server_port, case)
        print(json.dumps(row, allow_nan=False))
