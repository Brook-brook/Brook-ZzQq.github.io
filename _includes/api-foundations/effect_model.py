"""Original bounded, single-process teaching receiver, not a durable service.

Keys are op-1/op-2, units1..3. Keyed mode atomically remembers exact payload and
receipt in this in-memory model. This does not promise distributed exactly-once,
authentication, persistent deduplication, cache expiry or rollback.
"""
from copy import deepcopy


def record(value, fields):
    if type(value) is not dict or set(value) != set(fields):
        raise ValueError("record_fields")


def command(key, units):
    if type(key) is not str or key not in ("op-1", "op-2"):
        raise ValueError("command_key")
    if type(units) is not int or not 1 <= units <= 3:
        raise ValueError("command_units")


def new_receiver(mode):
    if type(mode) is not str or mode not in ("plain", "keyed"):
        raise ValueError("receiver_mode")
    return {"mode": mode, "value": 0, "writes": 0, "receipts": []}


def checked_receiver(receiver):
    record(receiver, ("mode", "value", "writes", "receipts"))
    if receiver["mode"] not in ("plain", "keyed"):
        raise ValueError("receiver_mode")
    writes, value, receipts = receiver["writes"], receiver["value"], receiver["receipts"]
    if type(writes) is not int or not 0 <= writes <= 6 or type(value) is not int or not writes <= value <= writes * 3:
        raise ValueError("receiver_counts")
    if type(receipts) is not list or len(receipts) > 2:
        raise ValueError("receiver_receipts")
    if receiver["mode"] == "plain":
        if receipts:
            raise ValueError("plain_cache")
    else:
        running, seen = 0, set()
        for index, receipt in enumerate(receipts, 1):
            record(receipt, ("id", "key", "units", "value_after"))
            command(receipt["key"], receipt["units"])
            running += receipt["units"]
            if receipt["key"] in seen or type(receipt["id"]) is not str or receipt["id"] != "r-" + str(index) or type(receipt["value_after"]) is not int or receipt["value_after"] != running:
                raise ValueError("receipt_identity")
            seen.add(receipt["key"])
        if writes != len(receipts) or value != running:
            raise ValueError("cache_consistency")


def apply_effect(receiver, key, units):
    checked_receiver(receiver)
    command(key, units)
    next_receiver = deepcopy(receiver)
    if receiver["mode"] == "keyed":
        cached = next((r for r in receiver["receipts"] if r["key"] == key), None)
        if cached is not None:
            if cached["units"] != units:
                return next_receiver, {"status": "conflict", "receipt": None}
            return next_receiver, {"status": "replayed", "receipt": deepcopy(cached)}
    if receiver["writes"] >= 6:
        return next_receiver, {"status": "write_limit", "receipt": None}
    next_receiver["value"] += units
    next_receiver["writes"] += 1
    receipt = {"id": "r-" + str(next_receiver["writes"]), "key": key,
               "units": units, "value_after": next_receiver["value"]}
    if receiver["mode"] == "keyed":
        next_receiver["receipts"].append(deepcopy(receipt))
    return next_receiver, {"status": "applied", "receipt": receipt}


def lookup_effect(receiver, key, units):
    checked_receiver(receiver)
    command(key, units)
    if receiver["mode"] == "plain":
        return {"status": "lookup_unavailable", "receipt": None}
    cached = next((r for r in receiver["receipts"] if r["key"] == key), None)
    if cached is None:
        return {"status": "not_found", "receipt": None}
    if cached["units"] != units:
        return {"status": "conflict", "receipt": None}
    return {"status": "found", "receipt": deepcopy(cached)}
