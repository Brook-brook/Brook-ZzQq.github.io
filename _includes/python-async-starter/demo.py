"""Run the original demonstration on local Python3.11+; stdlib only."""
import asyncio
import json
from async_wait import wait_demo

for cancel in (True, False):
    result = asyncio.run(wait_demo(cancel=cancel))
    print(json.dumps({"case": "cancel" if cancel else "release", **result}))
