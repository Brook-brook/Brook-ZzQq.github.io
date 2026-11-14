---
layout: atlas
title: 理解等待与取消
date: 2026-11-14
category: Python
ai_assisted: true
kind: tutorial
tags: [Python, asyncio, async, await, TaskGroup, Agent, 取消, 协程]
summary: 真正运行Event协调的任务，比较释放和取消；分清协程对象、任务调度、清理与强制终止，读懂Agent桥接的异步基础。
lab_url: /playground/python/
download:
  path: /assets/examples/python-async-starter.zip
  filename: brook-python-async.zip
  label: 下载原创 Python 异步练习
  detail: 本机 Python 3.11+，仅标准库，无需pip或模型Key。
toc:
  - {id: run, label: 在网页真实运行}
  - {id: roles, label: 调用不等于开始运行}
  - {id: events, label: 用事件核对实际顺序}
  - {id: cancellation, label: 请求取消之后发生什么}
  - {id: host, label: 回到Agent代码}
  - {id: local, label: 在自己的Python运行}
  - {id: sources, label: 来源与边界}
---

[Agent与MCP连接练习](../agent-mcp-bridge/)里为什么到处是`async`和`await`？
先用一个没有模型、网络或额外SDK的原创AI辅助例子，观察真正的任务状态。
这里不会用动画或几段预写日志冒充Python执行。

## 在网页真实运行 {#run}

打开[预选异步示例的Python实验]({{ '/playground/python/#async-wait' | relative_url }})，
点击加载Python，再运行代码。首次下载仍需要网络；示例执行只用标准库。
四个学习选项可手动切换，预选不会自动加载、运行或记录完成。

输出有`cancel`和`release`两行JSON。先预测哪一行出现`task:resumed`，
再核对`before_schedule`、`events`、`task_done`和`task_cancelled`。
代码可以修改，运行期间暂时只读，让输出对应本次提交的内容。

## 调用，不等于开始运行 {#roles}

| 写法 | 在本例中做什么 |
| --- | --- |
| `async def worker()` | 定义协程函数 |
| `pending = worker()` | 创建协程对象，函数体还没有运行 |
| `group.create_task(pending)` | 把协程安排成这个TaskGroup所属任务 |
| `await entered.wait()` | 当前任务在需要时等待，让其他任务有机会推进 |
| 离开`async with TaskGroup()` | 等所属任务结束，再继续本例宿主 |

因此，`before_schedule`确实是空列表；不是用“已启动”标签代替观察。
`async`本身不创建线程、不让CPU计算自动并行。协作调度仍依赖等待点，
把耗CPU的长循环放进`async def`也可能卡住其事件循环。

## 用事件，核对实际顺序 {#events}

子任务先记录`task:waiting`，设置`entered`，然后等待`gate`。宿主明确
等到`entered`后才继续，不用“睡一秒应该够了”猜任务在哪里。

`cancel=False`时，宿主设置`gate`。子任务继续、执行清理，所属任务被
等待结束后，宿主才记录`host:joined`：

```text
task:waiting → host:continued → host:released
→ task:resumed → task:cleanup → host:joined
```

这是该事件协调程序的实际顺序，不是所有并发程序都固定如此，也不是
耗时或吞吐量成绩。Event协调同一异步循环，不是跨线程锁或网络消息。

## 请求取消之后，发生什么 {#cancellation}

`cancel=True`时，宿主调用`task.cancel()`，再由TaskGroup等子任务退出。
本例子任务已在等待点，没有吞掉`CancelledError`，进入过的`finally`
执行清理，然后结束。因此没有`task:resumed`，最终`task_cancelled`为真。

`cancel()`是请求，不是立刻杀掉线程；其他协程可能处理甚至不正确地
吞掉取消，未开始的协程也可能根本没进入`finally`。不要把本例的顺序
外推成任意程序必然安全退出。通常清理后仍应传播取消；它继承自
`BaseException`，不能简单当普通`Exception`统一吞掉。

本例TaskGroup等待所属子任务；显式取消子任务的`CancelledError`本身
不作为普通失败。**外部取消宿主**仍向外传播，包内也验证所属任务被
等候，不会留下后台悬挂任务。这是Python3.11+的任务归属，不是MCP权限、
模型预算或撤销工具操作。

页面“停止”和5秒超时是另一机制：直接终止整个Worker，**不承诺Python
finally会执行**。已发送的外部操作不会因此倒退；本例没有外部操作，
不能拿它作支付、写入等操作的撤销证明。

## 回到Agent代码 {#host}

`await provider.responses.create(...)`等待SDK返回，`await mcp.call_tool(...)`
等待协议结果；不能单独证明模型推理、远端执行次数或任务正确。取消
运行还须明确保留哪些观察、怎样关闭连接、由谁接收异常。

桥接例子的取消分支保留部分观察并继续抛出取消。这份基础练习帮助你
理解它，没有在浏览器安装OpenAI/MCP SDK。Pyodide不是完整本地Python，
把本机项目粘贴过来也不表示依赖、传输或权限都已可用。

## 在自己的Python运行 {#local}

解压进入`brooks-python-async`，用Python3.11+执行：

```sh
python3 demo.py
python3 run_checks.py
```

没有pip依赖。网页与包内`async_wait.py`复用同一函数源码。本机入口用
`asyncio.run`启动循环，网页已在异步运行环境，使用顶层`await`，不能
直接在其中再套`asyncio.run`。

六项检查验证取消/释放状态与顺序、重复运行无所属任务泄漏、并发状态
独立、严格bool和外部取消传播，不是模型成绩或学习评分。
[文件与哈希]({{ '/assets/examples/python-async-starter.manifest.json' | relative_url }})
只帮助核对材料，不是签名或安全认证。

## 来源与边界 {#sources}

2026-11-14对照CPython3.11.18固定
`26badd80b6dc7786cd8fb63c3608a31f04754219`相关部分，原创例子没有复制
上游示例或运行时：

- [协程、任务与取消](https://github.com/python/cpython/blob/26badd80b6dc7786cd8fb63c3608a31f04754219/Doc/library/asyncio-task.rst)：包括TaskGroup、取消请求和最终状态。
- [Event](https://github.com/python/cpython/blob/26badd80b6dc7786cd8fb63c3608a31f04754219/Doc/library/asyncio-sync.rst)：等待、设置与非线程安全范围。
- [实际完整许可](https://github.com/python/cpython/blob/26badd80b6dc7786cd8fb63c3608a31f04754219/LICENSE)：软件/文档PSF2，文档代码另有0BSD双许可，与本原创MIT材料分开记录。

这是局部程序调度练习，没有模型、MCP互通、真实网络、CPU并行或通用
取消可靠性成绩。浏览器运行与本机检查结果分别报告。
