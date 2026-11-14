# Brook的异步等待与取消

原创AI辅助Python教学材料，MIT / Copyright2026 Brook，全文LICENSE.txt随包。
Python3.11+，只用标准库，不需pip、模型Key、HTTP服务或用户资料。

```sh
python3 demo.py
python3 run_checks.py
```

async_wait.py是网页Python示例与本机包共享的同一函数。Event明确协调
等待顺序，不用一段睡眠猜执行时间。TaskGroup在离开async with前等所属
子任务结束；示例对照释放等待和请求取消。async函数被调用时先创建
协程对象；Task/await才驱动调度。async不自动变成CPU并行。

demo.py用asyncio.run启动普通脚本事件循环。网页Pyodide已经运行在其
异步环境中，使用顶层await wait_demo(...)，不在其中嵌套asyncio.run。
两种入口不同，核心函数相同；浏览器不是完整本地Python环境。

cancel()是请求，task.cancelled()是本例结束后的状态。子协程没有吞掉
CancelledError，已进入的finally运行后再退出；TaskGroup会等待它。
外部取消调用者时会继续向外传播，不留下所属未结束子任务。本例不
承诺任意任务一定接受取消，也不承诺未开始的协程会进入finally。
网页停止/超时会直接终止Worker，不能由本例推断那时finally一定执行，
更不能把取消当作撤回已发送的网络动作。

六项检查对应顺序/状态、重复不泄漏任务、并发状态独立、严格bool和
外部取消传播。没有计时成绩、真实模型或Agent/MCP互通验证。

2026-11-14对照CPython3.11.18固定
26badd80b6dc7786cd8fb63c3608a31f04754219的Coroutines/Tasks、TaskGroup、
Task取消/状态与Event相关范围，未复制其文档示例或Python实现。
https://github.com/python/cpython/tree/26badd80b6dc7786cd8fb63c3608a31f04754219
其软件/文档按PSF2，文档代码另有0BSD双许可；完整实际上游LICENSE在
站点licenses/CPython-LICENSE.txt保留，本包不转存Python运行时/库/文档。
