"""Actually interrupt and restart owned child processes over one temporary DB.

No prewritten results. Child response/exit and teaching-observer DB snapshots
are separate. No HTTP, model, external action or user database is used.
"""
import json
from pathlib import Path
import platform
import sqlite3
import subprocess
import sys
import tempfile
from receiver import initialize, command, UNKNOWN_EXIT

SCENARIOS = (
    ("after-commit-retry", (("apply", "op-1", 2, "after_commit"), ("apply", "op-1", 2, "none"))),
    ("before-commit-retry", (("apply", "op-1", 2, "before_commit"), ("apply", "op-1", 2, "none"))),
    ("after-commit-lookup", (("apply", "op-1", 2, "after_commit"), ("lookup", "op-1", 2, "none"))),
    ("changed-payload", (("apply", "op-1", 2, "after_commit"), ("apply", "op-1", 3, "none"))),
    ("new-key", (("apply", "op-1", 2, "after_commit"), ("apply", "op-2", 1, "none"))),
    ("historical-receipt", (("apply", "op-1", 2, "none"), ("apply", "op-2", 1, "none"), ("lookup", "op-1", 2, "none"))),
)


def run_worker(path, action, key, units, interrupt="none"):
    command(key, units)
    if action not in ("apply", "lookup") or interrupt not in ("none", "before_commit", "after_commit") or action == "lookup" and interrupt != "none":
        raise ValueError("worker_arguments")
    completed = subprocess.run([
        sys.executable, "-I", "-S", "-B", str(Path(__file__).with_name("receiver.py")),
        "--database", str(path), "--action", action, "--key", key,
        "--units", str(units), "--interrupt", interrupt,
    ], capture_output=True, text=True, timeout=5, check=False)
    if completed.returncode not in (0, UNKNOWN_EXIT) or completed.stderr:
        raise RuntimeError("The teaching child failed outside the declared interruption")
    if completed.returncode == UNKNOWN_EXIT:
        if completed.stdout:
            raise ValueError("An interrupted child must not invent a reply")
        response = None
    else:
        if not 0 < len(completed.stdout.encode("utf-8")) <= 2048:
            raise ValueError("child_reply_size")
        response = json.loads(completed.stdout)
        if type(response) is not dict or set(response) != {"status", "receipt"}:
            raise ValueError("child_reply_shape")
        allowed = {"applied", "replayed", "conflict"} if action == "apply" else {"found", "not_found", "conflict"}
        if response["status"] not in allowed:
            raise ValueError("child_reply_role")
        receipt = response["receipt"]
        if response["status"] in {"applied", "replayed", "found"}:
            if type(receipt) is not dict or set(receipt) != {"id", "key", "units", "value_after"}:
                raise ValueError("receipt_shape")
            command(receipt["key"], receipt["units"])
            if receipt["key"] != key or receipt["units"] != units or receipt["id"] not in ("r-1", "r-2") or type(receipt["value_after"]) is not int or not 1 <= receipt["value_after"] <= 6:
                raise ValueError("receipt_correlation")
        elif receipt is not None:
            raise ValueError("error_receipt")
    return {"action": action, "key": key, "units": units,
            "process_exit_code": completed.returncode, "reply_received": response is not None,
            "outcome": "unknown" if response is None else response["status"], "response": response}


def run_observer(path):
    # The observation also reopens the file in a newly started process. The
    # parent never uses a retained connection/object as proof of recovery.
    completed = subprocess.run([
        sys.executable, "-I", "-S", "-B", str(Path(__file__).with_name("receiver.py")),
        "--database", str(path), "--action", "inspect",
    ], capture_output=True, text=True, timeout=5, check=False)
    if completed.returncode != 0 or completed.stderr or not 0 < len(completed.stdout.encode("utf-8")) <= 2048:
        raise RuntimeError("The independent teaching observer did not complete")
    value = json.loads(completed.stdout)
    if type(value) is not dict or set(value) != {"value", "effects", "receipts"}:
        raise ValueError("observer_shape")
    return value


def run_scenario(name, steps):
    with tempfile.TemporaryDirectory(prefix="brook-agent-restart-") as directory:
        path = Path(directory) / "owned-teaching.sqlite"
        initialize(path)
        trace, observer = [], []
        for action, key, units, interrupt in steps:
            trace.append(run_worker(path, action, key, units, interrupt))
            observer.append(run_observer(path))
        return {"schema_version": 1, "kind": "brook-sqlite-restart-teaching", "scenario": name,
                "python": platform.python_version(), "sqlite": sqlite3.sqlite_version,
                "model_called": False, "transport": "actual-child-process-and-temporary-sqlite",
                "observer_transport": "separate-fresh-child-process",
                "client_trace": trace, "teaching_observer": observer,
                "scope": "Original owned temporary DB and actual child os._exit/reopen. One DB transaction includes this counter and receipt; no external effect, model, HTTP, private journal, distributed exactly-once or power-loss guarantee."}


if __name__ == "__main__":
    for scenario in SCENARIOS:
        print(json.dumps(run_scenario(*scenario), allow_nan=False))
