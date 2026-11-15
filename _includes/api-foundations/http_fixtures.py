"""Original authored HTTP fault fixtures, real sockets on127.0.0.1 only.

No model, filesystem endpoint, proxy or arbitrary URL. Not a production server.
"""
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import socket
import threading

VALID = b'{"schema_version":1,"task":"sum","values":[1,2,3]}'


class FixtureHandler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def setup(self):
        super().setup()
        self.connection.settimeout(1)

    def log_message(self, *_):
        pass

    def do_GET(self):
        with self.server.count_lock:
            self.server.request_paths.append(self.path)
        case = self.path.removeprefix("/cases/")
        if not self.path.startswith("/cases/"):
            self.send_error(404)
            return
        if case == "disconnect":
            self.close_connection = True
            try:
                self.connection.shutdown(socket.SHUT_RDWR)
            except OSError:
                pass
            self.connection.close()
            return
        if case == "timeout":
            self.server.entered.set()
            self.server.release.wait(2)
        responses = {
            "valid": (200, "application/json", VALID),
            "bad-json": (200, "application/json", b'{"schema_version":'),
            "wrong-type": (200, "application/json", b'{"schema_version":1,"task":"sum","values":[true]}'),
            "wrong-media": (200, "text/plain", VALID),
            "no-content": (204, None, b""),
            "rate-limit": (429, "application/json", b'{"fixture":"rate-limit"}'),
            "unavailable": (503, "application/json", b'{"fixture":"unavailable"}'),
            "redirect": (302, "application/json", b""),
            "too-large": (200, "application/json", b" " * 4096),
            "timeout": (200, "application/json", VALID),
        }
        status, media, body = responses.get(case, (404, "text/plain", b"unknown fixture"))
        self.send_response(status)
        if media is not None:
            self.send_header("Content-Type", media)
        if case in {"rate-limit", "unavailable"}:
            self.send_header("Retry-After", "5")
        if case == "redirect":
            self.send_header("Location", "/cases/valid")
        if status != 204:
            self.send_header("Content-Length", str(len(body)))
        self.send_header("Connection", "close")
        self.end_headers()
        try:
            self.wfile.write(body)
        except (BrokenPipeError, ConnectionResetError):
            pass
        self.close_connection = True


@contextmanager
def fixture_server():
    server = ThreadingHTTPServer(("127.0.0.1", 0), FixtureHandler)
    server.daemon_threads = False
    server.release = threading.Event()
    server.entered = threading.Event()
    server.count_lock = threading.Lock()
    server.request_paths = []
    thread = threading.Thread(target=server.serve_forever, kwargs={"poll_interval": 0.01}, daemon=True)
    thread.start()
    try:
        yield server
    finally:
        server.release.set()
        server.shutdown()
        server.server_close()
        thread.join(timeout=3)
        if thread.is_alive():
            raise RuntimeError("The fixture server thread did not finish")
