"""Original real loopback delivery fixtures with an in-memory receiver.

First-request disconnect is deliberate fault injection, before/after a local
effect. Idempotency-Key is THIS fixture's contract, not presumed remote support.
The lock covers effect and cached receipt together; there is no durable storage,
distributed exactly-once guarantee, account, external action or model.
"""
from contextlib import contextmanager
from copy import deepcopy
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import http.client
import json
import re
import socket
import threading
from effect_model import new_receiver, apply_effect, checked_receiver, command, record
from json_contracts import decode_json_document, ContractError, MAX_JSON_BYTES

SUCCESS = {"applied", "replayed", "found"}
STATUS = {"applied": 200, "replayed": 200, "found": 200, "conflict": 409,
          "not_found": 404, "lookup_unavailable": 404, "invalid_request": 400,
          "write_limit": 429, "lookup_limit": 429}


class DeliveryHandler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def setup(self):
        super().setup()
        self.connection.settimeout(1)

    def log_message(self, *_):
        pass

    def drop_receipt(self):
        self.close_connection = True
        try:
            self.connection.shutdown(socket.SHUT_RDWR)
        except OSError:
            pass
        self.connection.close()

    def reply(self, response):
        raw = json.dumps(response, allow_nan=False).encode("utf-8")
        self.send_response(STATUS[response["status"]])
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Connection", "close")
        self.end_headers()
        try:
            self.wfile.write(raw)
        except (BrokenPipeError, ConnectionResetError):
            pass
        self.close_connection = True

    def do_POST(self):
        if self.path != "/trial/add":
            self.reply({"status": "invalid_request", "receipt": None})
            return
        with self.server.state_lock:
            self.server.write_requests_received += 1
            first = self.server.write_requests_received == 1
            over_budget = self.server.write_requests_received > 6
        if over_budget:
            self.reply({"status": "write_limit", "receipt": None})
            return
        try:
            lengths = self.headers.get_all("Content-Length") or []
            keys = self.headers.get_all("Idempotency-Key") or []
            media = self.headers.get_all("Content-Type") or []
            if len(lengths) != 1 or len(lengths[0]) > 10 or not lengths[0].isascii() or not lengths[0].isdigit() or not 0 < int(lengths[0]) <= MAX_JSON_BYTES:
                raise ValueError("body_length")
            if len(keys) != 1 or len(media) != 1 or self.headers.get_content_type() != "application/json" or self.headers.get("Transfer-Encoding") is not None:
                raise ValueError("request_headers")
            if self.headers.get_content_charset("utf-8") not in ("utf-8", "utf8") or self.headers.get("Content-Encoding", "identity").strip().lower() != "identity":
                raise ValueError("request_representation")
            raw = self.rfile.read(int(lengths[0]))
            if len(raw) != int(lengths[0]):
                raise ValueError("body_length")
            payload = decode_json_document(raw.decode("utf-8"))
            record(payload, ("units",))
            command(keys[0], payload["units"])
        except (ValueError, UnicodeError, OSError):
            self.reply({"status": "invalid_request", "receipt": None})
            return
        fault = self.server.first_fault if first else "none"
        if fault == "before":
            self.drop_receipt()
            return
        with self.server.state_lock:
            self.server.receiver, response = apply_effect(self.server.receiver, keys[0], payload["units"])
        if fault == "after":
            self.drop_receipt()
            return
        self.reply(response)

    def do_GET(self):
        prefix = "/trial/receipt/"
        key = self.path.removeprefix(prefix)
        if not self.path.startswith(prefix) or key not in ("op-1", "op-2"):
            self.reply({"status": "invalid_request", "receipt": None})
            return
        with self.server.state_lock:
            self.server.lookup_requests_received += 1
            if self.server.lookup_requests_received > 6:
                response = {"status": "lookup_limit", "receipt": None}
            elif self.server.receiver["mode"] == "plain":
                response = {"status": "lookup_unavailable", "receipt": None}
            else:
                receipt = next((r for r in self.server.receiver["receipts"] if r["key"] == key), None)
                response = {"status": "not_found", "receipt": None} if receipt is None else {"status": "found", "receipt": deepcopy(receipt)}
        self.reply(response)


@contextmanager
def delivery_server(mode, first_fault="after"):
    receiver = new_receiver(mode)
    if type(first_fault) is not str or first_fault not in ("before", "after", "none"):
        raise ValueError("first_fault")
    server = ThreadingHTTPServer(("127.0.0.1", 0), DeliveryHandler)
    server.daemon_threads = False
    server.receiver = receiver
    server.first_fault = first_fault
    server.state_lock = threading.Lock()
    server.write_requests_received = 0
    server.lookup_requests_received = 0
    thread = threading.Thread(target=server.serve_forever, kwargs={"poll_interval": 0.01}, daemon=True)
    thread.start()
    try:
        yield server
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=3)
        if thread.is_alive():
            raise RuntimeError("The delivery fixture thread did not finish")


def request_delivery(port, key, units, *, lookup=False):
    command(key, units)
    if type(port) is not int or not 1 <= port <= 65535 or type(lookup) is not bool:
        raise ValueError("client_settings")
    row = {"request": "lookup" if lookup else "write", "key": key, "units": units,
           "http_requests_attempted": 0, "response_headers_received": False,
           "http_status": None, "outcome": "unknown", "response_kind": None,
           "receipt": None, "error": None}
    connection = http.client.HTTPConnection("127.0.0.1", port, timeout=1)
    try:
        row["http_requests_attempted"] += 1
        if lookup:
            connection.request("GET", "/trial/receipt/" + key, headers={"Accept": "application/json"})
        else:
            body = json.dumps({"units": units}, allow_nan=False).encode("utf-8")
            connection.request("POST", "/trial/add", body=body, headers={"Content-Type": "application/json", "Idempotency-Key": key})
        response = connection.getresponse()
        row.update(response_headers_received=True, http_status=response.status)
        raw = response.read(MAX_JSON_BYTES + 1)
        media = response.headers.get_all("Content-Type") or []
        lengths = response.headers.get_all("Content-Length") or []
        if len(raw) > MAX_JSON_BYTES or len(media) != 1 or response.headers.get_content_type() != "application/json":
            raise ValueError("response_representation")
        if response.headers.get_content_charset("utf-8") not in ("utf-8", "utf8") or response.getheader("Content-Encoding", "identity").strip().lower() != "identity":
            raise ValueError("response_representation")
        if len(lengths) > 1 or (lengths and (len(lengths[0]) > 10 or not lengths[0].isascii() or not lengths[0].isdigit() or int(lengths[0]) != len(raw))):
            raise ValueError("response_length")
        value = decode_json_document(raw.decode("utf-8"))
        record(value, ("status", "receipt"))
        if type(value["status"]) is not str or value["status"] not in STATUS or STATUS[value["status"]] != response.status:
            raise ValueError("response_status")
        allowed = {"found", "not_found", "lookup_unavailable", "lookup_limit", "invalid_request"} if lookup else {"applied", "replayed", "conflict", "write_limit", "invalid_request"}
        if value["status"] not in allowed:
            raise ValueError("response_role")
        row["response_kind"] = value["status"]
        if value["status"] in SUCCESS:
            receipt = value["receipt"]
            record(receipt, ("id", "key", "units", "value_after"))
            command(receipt["key"], receipt["units"])
            if type(receipt["id"]) is not str or not re.fullmatch(r"r-[1-6]", receipt["id"]) or type(receipt["value_after"]) is not int or not 1 <= receipt["value_after"] <= 18:
                raise ValueError("receipt_shape")
            if receipt["key"] != key or receipt["units"] != units:
                row.update(outcome="conflict", error="payload_mismatch")
                return row
            row.update(outcome="confirmed", receipt=deepcopy(receipt))
        else:
            if value["receipt"] is not None:
                raise ValueError("error_receipt")
            row["outcome"] = value["status"]
        return row
    except (OSError, http.client.HTTPException):
        row["error"] = "response_missing"
        return row
    except (ValueError, UnicodeError, ContractError):
        row["error"] = "response_contract"
        return row
    finally:
        connection.close()


def public_receiver_snapshot(server):
    with server.state_lock:
        checked_receiver(server.receiver)
        return {"receiver": deepcopy(server.receiver),
                "write_requests_received": server.write_requests_received,
                "lookup_requests_received": server.lookup_requests_received}
