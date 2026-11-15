"""Six actual local HTTP scenarios, including real effects before disconnect.

The receiver snapshot is a teaching observer, not knowledge available to every
client. No arbitrary external server, authentication, durable storage or model.
"""
import json
from delivery_http import delivery_server, request_delivery, public_receiver_snapshot

SCENARIOS = (
    ("plain-after-retry", "plain", "after", (("op-1", 2), ("op-1", 2)), None),
    ("keyed-after-retry", "keyed", "after", (("op-1", 2), ("op-1", 2)), None),
    ("keyed-before-retry", "keyed", "before", (("op-1", 2), ("op-1", 2)), None),
    ("keyed-payload-conflict", "keyed", "after", (("op-1", 2), ("op-1", 3)), None),
    ("keyed-new-operation", "keyed", "after", (("op-1", 2), ("op-2", 2)), None),
    ("keyed-reconcile", "keyed", "after", (("op-1", 2),), ("op-1", 2)),
)


def run_scenario(name, mode, fault, writes, lookup):
    with delivery_server(mode, fault) as server:
        trace = [request_delivery(server.server_port, key, units) for key, units in writes]
        if lookup is not None:
            trace.append(request_delivery(server.server_port, *lookup, lookup=True))
        snapshot = public_receiver_snapshot(server)
    return {"schema_version": 1, "kind": "brook-delivery-http-fixture", "scenario": name,
            "model_called": False, "transport": "actual-loopback-http", "first_fault": fault,
            "client_trace": trace, "teaching_observer": snapshot,
            "scope": "Original fault injection; real local HTTP and in-memory effects, not public-network evidence, durable deduplication, authentication or distributed exactly-once."}


if __name__ == "__main__":
    for row in SCENARIOS:
        print(json.dumps(run_scenario(*row), allow_nan=False))
