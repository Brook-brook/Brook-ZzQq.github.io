"""Original bounded SQLite teaching receiver, not a production Agent runtime.

Only the temporary demo database is used. A counter and its receipt share one
transaction. No model, HTTP, external action, journal input or arbitrary SQL API.
Process interruption is installed only by the explicit internal worker entry.
"""
import argparse
from contextlib import contextmanager
from copy import deepcopy
import json
import os
from pathlib import Path
import sqlite3

UNKNOWN_EXIT = 75


def command(key, units):
    if type(key) is not str or key not in ("op-1", "op-2") or type(units) is not int or not 1 <= units <= 3:
        raise ValueError("command")


@contextmanager
def database(path):
    # mode=rw prevents a misspelled recovery path from creating a fresh database.
    uri = Path(path).resolve().as_uri() + "?mode=rw"
    connection = sqlite3.connect(uri, uri=True, isolation_level=None, timeout=1)
    try:
        if connection.execute("PRAGMA user_version").fetchone()[0] != 1:
            raise ValueError("schema_version")
        if connection.execute("PRAGMA journal_mode").fetchone()[0] != "delete":
            raise ValueError("journal_mode")
        connection.execute("PRAGMA synchronous=FULL")
        yield connection
    finally:
        connection.close()


def initialize(path):
    # Exclusive creation: never reset or silently replace an existing file.
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    os.close(descriptor)
    connection = sqlite3.connect(path, isolation_level=None, timeout=1)
    try:
        connection.execute("PRAGMA journal_mode=DELETE")
        connection.execute("PRAGMA synchronous=FULL")
        connection.execute("BEGIN IMMEDIATE")
        connection.execute("CREATE TABLE counter (id INTEGER PRIMARY KEY CHECK(id=1), total INTEGER NOT NULL CHECK(total BETWEEN 0 AND 6), effects INTEGER NOT NULL CHECK(effects BETWEEN 0 AND 2))")
        connection.execute("CREATE TABLE receipt (number INTEGER PRIMARY KEY CHECK(number BETWEEN 1 AND 2), operation_key TEXT UNIQUE NOT NULL CHECK(operation_key IN ('op-1','op-2')), units INTEGER NOT NULL CHECK(units BETWEEN 1 AND 3), value_after INTEGER NOT NULL CHECK(value_after BETWEEN 1 AND 6))")
        connection.execute("INSERT INTO counter VALUES (1,0,0)")
        connection.execute("PRAGMA user_version=1")
        connection.execute("COMMIT")
    except BaseException:
        if connection.in_transaction:
            connection.execute("ROLLBACK")
        raise
    finally:
        connection.close()


def snapshot(connection):
    rows = connection.execute("SELECT id,total,effects FROM counter").fetchall()
    receipts = connection.execute("SELECT number,operation_key,units,value_after FROM receipt ORDER BY number").fetchall()
    if len(rows) != 1 or rows[0][0] != 1:
        raise ValueError("counter_shape")
    _, total, effects = rows[0]
    if type(total) is not int or type(effects) is not int or not 0 <= effects <= 2 or not effects <= total <= effects * 3 or len(receipts) != effects:
        raise ValueError("counter_counts")
    remembered, running, seen = [], 0, set()
    for index, (number, key, units, value_after) in enumerate(receipts, 1):
        command(key, units)
        running += units
        if type(number) is not int or number != index or key in seen or type(value_after) is not int or value_after != running:
            raise ValueError("receipt_consistency")
        seen.add(key)
        remembered.append({"id": f"r-{number}", "key": key, "units": units, "value_after": value_after})
    if running != total:
        raise ValueError("counter_consistency")
    return {"value": total, "effects": effects, "receipts": remembered}


def inspect_database(path):
    with database(path) as connection:
        # Read the two tables in one consistent read transaction. Reopening may
        # let SQLite recover its own journal; this never increments the counter.
        connection.execute("BEGIN")
        try:
            value = snapshot(connection)
            connection.execute("COMMIT")
            return value
        except BaseException:
            if connection.in_transaction:
                connection.execute("ROLLBACK")
            raise


def apply_operation(path, key, units, *, before_commit=None, after_commit=None):
    command(key, units)
    with database(path) as connection:
        connection.execute("BEGIN IMMEDIATE")
        try:
            before = snapshot(connection)
            existing = next((row for row in before["receipts"] if row["key"] == key), None)
            if existing is not None:
                response = {"status": "replayed", "receipt": deepcopy(existing)} if existing["units"] == units else {"status": "conflict", "receipt": None}
                if before_commit is not None:
                    before_commit()
                connection.execute("COMMIT")
                if after_commit is not None:
                    after_commit()
                return response
            number, total = before["effects"] + 1, before["value"] + units
            connection.execute("UPDATE counter SET total=?,effects=? WHERE id=1", (total, number))
            connection.execute("INSERT INTO receipt VALUES (?,?,?,?)", (number, key, units, total))
            if before_commit is not None:
                before_commit()
            connection.execute("COMMIT")
            if after_commit is not None:
                after_commit()
            return {"status": "applied", "receipt": {"id": f"r-{number}", "key": key, "units": units, "value_after": total}}
        except BaseException:
            if connection.in_transaction:
                connection.execute("ROLLBACK")
            raise


def lookup_operation(path, key, units):
    command(key, units)
    current = inspect_database(path)
    receipt = next((row for row in current["receipts"] if row["key"] == key), None)
    if receipt is None:
        return {"status": "not_found", "receipt": None}
    return {"status": "found", "receipt": receipt} if receipt["units"] == units else {"status": "conflict", "receipt": None}


def worker_main():
    parser = argparse.ArgumentParser(description="Internal worker for the owned temporary SQLite teaching demo")
    parser.add_argument("--database", required=True)
    parser.add_argument("--action", choices=("apply", "lookup", "inspect"), required=True)
    parser.add_argument("--key", choices=("op-1", "op-2"))
    parser.add_argument("--units", type=int, choices=(1, 2, 3))
    parser.add_argument("--interrupt", choices=("none", "before_commit", "after_commit"), default="none")
    args = parser.parse_args()
    if args.action == "inspect":
        if args.key is not None or args.units is not None or args.interrupt != "none":
            parser.error("The teaching observer has no command or write interruption")
        print(json.dumps(inspect_database(args.database), allow_nan=False), flush=True)
        return
    if args.key is None or args.units is None:
        parser.error("A client action needs its explicit key and units")
    if args.action == "lookup" and args.interrupt != "none":
        parser.error("The lookup worker has no write/commit interruption")
    # os._exit is a real process exit that skips Python finally. It is used only
    # in this child worker, never by the website or the normal callable functions.
    interrupt = lambda: os._exit(UNKNOWN_EXIT)
    response = lookup_operation(args.database, args.key, args.units) if args.action == "lookup" else apply_operation(
        args.database, args.key, args.units,
        before_commit=interrupt if args.interrupt == "before_commit" else None,
        after_commit=interrupt if args.interrupt == "after_commit" else None)
    print(json.dumps(response, allow_nan=False), flush=True)


if __name__ == "__main__":
    worker_main()
