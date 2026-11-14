"""Original observable asyncio checks, not model evaluation or timing benchmarks."""
import asyncio
import unittest
from async_wait import wait_demo


class AsyncChecks(unittest.IsolatedAsyncioTestCase):
    async def test_cancel_is_requested_then_acknowledged_after_cleanup(self):
        value = await wait_demo(cancel=True)
        self.assertEqual(value["before_schedule"], [])
        self.assertEqual(value["events"], ["task:waiting", "host:continued", "host:cancel-requested", "task:cleanup", "host:joined"])
        self.assertTrue(value["cancel_requested"])
        self.assertTrue(value["task_done"]); self.assertTrue(value["task_cancelled"])
        self.assertNotIn("task:resumed", value["events"])

    async def test_release_resumes_and_joins_without_cancellation(self):
        value = await wait_demo(cancel=False)
        self.assertEqual(value["before_schedule"], [])
        self.assertEqual(value["events"], ["task:waiting", "host:continued", "host:released", "task:resumed", "task:cleanup", "host:joined"])
        self.assertFalse(value["cancel_requested"])
        self.assertTrue(value["task_done"]); self.assertFalse(value["task_cancelled"])

    async def test_repeated_runs_leave_no_extra_pending_tasks(self):
        before = asyncio.all_tasks()
        for cancel in (True, False, True):
            await wait_demo(cancel)
        self.assertEqual(asyncio.all_tasks(), before)

    async def test_concurrent_demo_state_is_independent(self):
        cancelled, released = await asyncio.gather(wait_demo(True), wait_demo(False))
        self.assertTrue(cancelled["task_cancelled"]); self.assertFalse(released["task_cancelled"])
        self.assertNotIn("host:released", cancelled["events"])
        self.assertNotIn("host:cancel-requested", released["events"])

    async def test_non_boolean_inputs_are_not_silently_coerced(self):
        for value in ("false", 1, None):
            with self.assertRaises(TypeError):
                await wait_demo(value)

    async def test_outer_cancellation_propagates_and_group_joins_its_child(self):
        before = asyncio.all_tasks()
        owner = asyncio.create_task(wait_demo(cancel=False))
        await asyncio.sleep(0)  # Let the owner reach its first actual suspension.
        self.assertTrue(owner.cancel())
        with self.assertRaises(asyncio.CancelledError):
            await owner
        self.assertEqual(asyncio.all_tasks(), before)


if __name__ == "__main__":
    unittest.main(verbosity=2)
