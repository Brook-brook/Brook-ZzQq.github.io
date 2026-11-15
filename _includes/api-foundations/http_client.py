"""Original fixed-loopback GET client. One explicit attempt, bounded body.

This is not a general HTTP client, a public service or model inference. A socket
timeout limits a blocking operation; it is not an entire-task deadline. No retry
or redirect is automatic here. No account, proxy variables or private file read.
"""
import http.client
import math
import socket
from json_contracts import analyze_json_request, ContractError, MAX_JSON_BYTES

CASE_NAMES = ("valid", "bad-json", "wrong-type", "wrong-media", "no-content",
              "rate-limit", "unavailable", "redirect", "too-large",
              "disconnect", "timeout")


def request_case(port, case, *, timeout=0.25):
    if type(port) is not int or not 1 <= port <= 65535 or type(case) is not str or case not in CASE_NAMES:
        raise ValueError("Use a known local fixture port and case")
    if type(timeout) not in (int, float) or not 0.05 <= timeout <= 5 or not math.isfinite(timeout):
        raise ValueError("Use a bounded blocking-operation timeout")
    row = {"case": case, "transport": "actual-loopback-http", "model_called": False,
           "http_requests_attempted": 0, "response_headers_received": False,
           "http_status": None, "body_bytes_read": 0, "stage": "transport",
           "retry_after": None, "result": None, "error": None}
    connection = http.client.HTTPConnection("127.0.0.1", port, timeout=timeout)
    try:
        row["http_requests_attempted"] += 1
        connection.request("GET", "/cases/" + case, headers={"Accept": "application/json"})
        response = connection.getresponse()
        row.update(response_headers_received=True, http_status=response.status, stage="http")
        if response.status != 200:
            row["error"] = {204: "expected_json_absent", 429: "rate_limited", 503: "unavailable"}.get(response.status, "http_status")
            advice = response.getheader("Retry-After")
            row["retry_after"] = advice if advice is not None and len(advice) <= 80 else None
            return row
        row["stage"] = "representation"
        media = response.headers.get_all("Content-Type") or []
        if len(media) != 1 or response.headers.get_content_type() != "application/json":
            row["error"] = "media_type"
            return row
        if response.headers.get_content_charset("utf-8") not in ("utf-8", "utf8"):
            row["error"] = "charset"
            return row
        if response.getheader("Content-Encoding", "identity").strip().lower() != "identity":
            row["error"] = "content_encoding"
            return row
        raw = response.read(MAX_JSON_BYTES + 1)
        row["body_bytes_read"] = len(raw)
        if len(raw) > MAX_JSON_BYTES:
            row["error"] = "document_too_large"
            return row
        length = response.getheader("Content-Length")
        if length is not None and (len(length) > 10 or not length.isascii() or not length.isdigit() or int(length) != len(raw)):
            row["error"] = "body_length"
            return row
        try:
            text = raw.decode("utf-8")
        except UnicodeError:
            row["error"] = "invalid_unicode"
            return row
        row["stage"] = "json"
        try:
            row["result"] = analyze_json_request(text)
        except ContractError as error:
            row["error"] = str(error)
            if str(error) not in {"json_syntax", "duplicate_name", "nonstandard_number"}:
                row["stage"] = "contract"
            return row
        row["stage"] = "computed"
        return row
    except (TimeoutError, socket.timeout):
        row["error"] = "timeout"
        return row
    except (OSError, http.client.HTTPException):
        row["error"] = "transport_error"
        return row
    finally:
        connection.close()
