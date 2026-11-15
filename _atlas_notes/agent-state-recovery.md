---
layout: atlas
title: 重启之后，回执还在吗？
title_keep: 回执
date: 2026-11-15
category: Agent Development
kind: tutorial
ai_assisted: true
tags: [Agent, 智能体, SQLite, transaction, 事务, state, 状态, recovery, 恢复, checkpoint, Agent开发]
summary: 用真实子进程退出、SQLite提交和新进程查询，区分进程内存、动作回执、模型上下文与外部副作用；不把一个数据库事务称为完整Agent恢复。
download:
  path: /assets/examples/agent-restart.zip
  filename: brook-agent-restart.zip
  label: 下载重启恢复练习
  detail: 带sqlite3的本机Python3.11+；只用标准库，实际创建临时数据库与子进程，无模型Key。
toc:
  - {id: lifetimes, label: 哪一层活得更久}
  - {id: run, label: 实际退出并重开}
  - {id: transaction, label: 计数与回执一起提交}
  - {id: observe, label: 相同未知，不同结果}
  - {id: external, label: 数据库之外的动作}
  - {id: sources, label: 来源与运行范围}
---

上一份回执练习只在内存记账。若程序在提交后、返回回执前退出，新进程
还能知道什么？这篇原创AI辅助练习把计数和回执放进同一个临时SQLite文件，
实际结束子进程，再重开查询。它不连接模型、HTTP或生产数据。

## 哪一层，活得更久 {#lifetimes}

- **进程内对象**：普通字典和函数局部值属于这次进程，退出不会替你序列化。
- **已提交文件记录**：新进程保留同一个文件、格式和读取权限，才可能重开。
  本例只记录两种公开操作的计数与回执，demo结束还会清理临时目录。
- **模型可见上下文**：数据库中存着，不表示模型已经看见。应用仍须选择
  哪些内容进入下一次请求；这也没有修改模型权重。
- **外部动作**：远端发布、邮件或其他服务的写入，不会自动进入本地事务。

先读[JSON与契约](../python-json-contracts/)和[未知结果](../agent-delivery-boundaries/)
会更容易理解；它们是补给，不是解锁条件。网页实验仍只有内存，下面的
下载项目才实际使用本机文件和进程，也不是保存私人学习手记的功能。

## 实际退出，再由新进程重开 {#run}

下载解压进入`brooks-agent-restart`，用带标准库sqlite3的Python3.11+运行：

```sh
python3 demo_restart.py
python3 run_checks.py
```

程序每个情景创建自己的临时目录与数据库；每一步都启动新的Python
子进程。指定中断时，子进程真的调用`os._exit(75)`，跳过Python清理，
没有返回回执。之后由另一进程重开同一个文件，结果由实际SQL计算。

75是本练习选择的中断标记，不是HTTP状态或SQLite通用错误码。默认demo
会核对它并继续观察，整体正常结束；意外退出/坏回包则报错，不补成功。
JSON里的Python/SQLite是实际运行版本，没有用修改变量冒充程序重启。

还不准备运行本机项目，也可以先
<a href="{{ '/assets/examples/agent-restart-case.json' | relative_url }}" download="brook-agent-restart-case.json">下载这次实际运行记录</a>。
它由当前公开ZIP实际重放生成，附运行UTC、Python/SQLite版本和ZIP/生成器
哈希。`injected_steps`是完整教学配置，`client_trace`是实际收到的回执与
退出码，`teaching_observer`则来自独立观察进程；配置不等于客户端知道。
这是一次记录，不是你的数据库、模型输出、身份认证或最新服务状态。

## 两张表，放在同一个事务 {#transaction}

这里的事务把一组数据库修改作为提交单位：本例的计数与回执一起提交，
或这次都不提交。它不表示整个程序从启动到结束都成了一个原子操作。

`receiver.py`先开启`BEGIN IMMEDIATE`，核对已记操作，再把计数更新与
回执插入放在同一事务中，显式`COMMIT`后才返回。相同key还要参数相同，
否则冲突；初始化只创建新文件，恢复时找错路径会失败，不悄悄新建空库。

为什么回执必须和效果一起提交？如果先改计数、后存回执，中间退出后
可能已经增加，却没有可用于去重的记录。本例的这两项都在同一数据库
事务内；不能把这种约束带到任意远端副作用。

提交前抛异常会回滚本次两张表的改动。提交后的异常却不能靠随后一句
rollback撤回已经提交的事务；客户端仍可能不知道结果。检查实际覆盖
这两种位置，也覆盖旧版本或记录不一致时报错，避免静默清空后重做。

## 相同的未知，不同的文件结果 {#observe}

下表每个情景都从**全新**数据库开始。窄屏可横向滚动；键盘聚焦表格
区域后，用方向键查看。完整参数和实际观察在CLI输出里。

<div class="note-evidence-scroll" role="group" tabindex="0" aria-label="进程退出与事务结果，可横向滚动" markdown="1">

| 情景 | 客户端先看到什么 | 新进程实际核对什么 |
| --- | --- | --- |
| 提交后退出，再发原操作 | 退出75，回执为空，unknown | 值2、效果1；重发取回旧回执，仍是2 |
| 提交前退出，再发原操作 | 同样没有回执，unknown | 没有已提交值；再发才增加到2 |
| 提交后退出，只查询 | 没有回执，unknown | 找到原回执，效果仍为1 |
| 同key把参数2改为3 | 原操作回执未收到 | 参数冲突，值仍为2 |
| 换新key增加1 | 原操作回执未收到 | 新操作提交，值变为3 |
| 查询旧op-1 | 两次操作各已收到回执 | 当前值3，旧回执的历史值仍为2 |

</div>

`client_trace`只记实际退出码和收到的回执；缺失时`response:null`。
`teaching_observer`才包含拥有临时数据库的教学视角，读取也另起独立
观察进程，不算作客户端动作。客户端单凭“没有
回执”，不能分辨提交前与提交后。甚至取回旧回执的子进程也可能再次
退出；检查核对重复丢回执时仍只有一次已提交效果。

两个独立子进程对同key提交，也要由数据库事务和唯一约束处理，不能只
靠一个进程里的Python锁。这里实际运行这项检查，但不声称测遍了调度、
锁等待、磁盘和所有文件系统故障。SQLite timeout也不是整个Agent总截止。

## 数据库之外，还缺什么 {#external}

如果改计数的同时还要发一封邮件，本地COMMIT不会把邮件一起变成原子
事务。本例没有外部动作，也未实现事务发件箱、补偿或分布式事务。
需要那些能力时，应先定义可核对的服务契约，保留未知，再设计恢复。

这也还不是完整Agent checkpoint。真实恢复可能还需任务/状态版本、
待核对动作、已用预算、授权与暂停条件，以及下一步怎样构造模型消息。
不能把旧模型提议无条件再执行一遍；持久日志也不是任务已经做对。
继续对照[循环里的上下文与状态](../agent-loop-basics/#context)和
[宿主停止边界](../agent-mcp-bridge/)。原只读GIS项目没有因此增加写权限。

本例用DELETE rollback journal与synchronous=FULL，进程退出后能实际重开
这个小数据库。没有测试机器掉电、存储损坏、网络文件系统或所有SQLite
恢复路径。结束进程不同于机器断电；八项检查不是耐久性或恰好一次认证。

## 实际来源与运行范围 {#sources}

2026-11-15阅读：

- [CPython3.11.18 sqlite3固定文档](https://github.com/python/cpython/blob/26badd80b6dc7786cd8fb63c3608a31f04754219/Doc/library/sqlite3.rst)：`connect`、`isolation_level=None`、显式事务、commit/rollback/close与占位符。
- [SQLite固定pager不变量](https://github.com/sqlite/sqlite/blob/e5cb4b09573aeb53cbb28983be7234e42c48c07a/doc/pager-invariants.txt)与[实际许可](https://github.com/sqlite/sqlite/blob/e5cb4b09573aeb53cbb28983be7234e42c48c07a/LICENSE.md)：回滚日志/锁/事务的来源背景及完整例外范围；不是这里编译或穷尽测试的最新SQLite。

sqlite.org事务/版权网页在本环境返回403，未声称已读取。代码、SQL、
输入与说明独立编写，完整CPython许可与SQLite源许可说明随包保留；
没有转存上游实现或二进制。演练只使用自己创建的临时文件，不读你的
数据库、浏览器学习手记或账户资料，也不从网站运行子进程。
