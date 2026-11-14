"""Original Brook asyncio teaching function, MIT. No model, network or timing claim."""
import asyncio


async def wait_demo(cancel=True):
    if type(cancel) is not bool:
        raise TypeError("cancel must be a Python bool")
    gate, entered = asyncio.Event(), asyncio.Event()
    events = []

    async def worker():
        events.append("task:waiting")
        entered.set()
        try:
            await gate.wait()
            events.append("task:resumed")
        finally:
            events.append("task:cleanup")

    # TaskGroup owns and joins this child, including on outer cancellation.
    async with asyncio.TaskGroup() as group:
        pending = worker()  # A coroutine object; its body has not run yet.
        before_schedule = list(events)
        task = group.create_task(pending)
        await entered.wait()  # Actual coordination, not a guessed sleep duration.
        events.append("host:continued")
        if cancel:
            requested = task.cancel()
            events.append("host:cancel-requested")
        else:
            requested = False
            gate.set()
            events.append("host:released")
    events.append("host:joined")
    return {"before_schedule": before_schedule, "events": events,
            "cancel_requested": requested, "task_done": task.done(),
            "task_cancelled": task.cancelled()}
