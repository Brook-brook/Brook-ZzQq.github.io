---
layout: atlas
title: 接通 Agent 与 MCP
date: 2026-11-14
category: Agent Development
kind: tutorial
ai_assisted: true
tags: [Agent, MCP, 智能体搭建, Agent搭建, 宿主适配, host, call_id, async, stdio]
summary: 跟踪真实SDK、宿主、本机协议与工具之间的路径，用预写响应检查关联、独立预算和失败；连接成功后仍要验收任务。
download:
  path: /assets/examples/agent-mcp-bridge.zip
  filename: brook-agent-mcp-bridge.zip
  label: 下载原创 Agent × MCP 连接练习
  detail: Python 3.11+；固定SDK安装后运行，默认假响应，无需Key。
toc:
  - {id: run, label: 先接通，再逐项拆开}
  - {id: host, label: 宿主填上中间这一跳}
  - {id: ids, label: 两种关联，不能互换}
  - {id: budgets, label: 数清尝试与已接收结果}
  - {id: receipts, label: 正确形状还要过参考检查}
  - {id: cancel, label: 停止之后留下什么}
  - {id: practice, label: 用一个反例检查理解}
  - {id: sources, label: 来源与实测边界}
---

你已经能[直接调用函数](../agent-project-starter/)，也能[单独运行MCP](../agent-mcp-server/)；
这次补上**宿主适配**。宿主就是管理循环、决定允许哪些操作、把提议交给
工具并接收结果的程序。两个SDK不会自动替你连好它。

这份原创AI辅助项目确实运行异步SDK和本机stdio；模型部分始终是预写假
响应。它用来理解程序契约，不是自主Agent或真实模型的能力展示。

## 先接通，再逐项拆开 {#run}

解压进入`brooks-agent-mcp-bridge`，使用Python3.11+。固定依赖为
`openai==3.50.0`、`mcp==2.3.0`、`httpx2==2.16.0`，实际Python3.12验证，
最低Python3.11也在禁用外部网络、只读文件系统的临时容器中通过同组检查。

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python demo_bridge.py
python run_checks.py
```

安装可能需要包索引；默认练习不联网、不读取Key，也不需要模型账户。
客户端自动启动/关闭本机MCP服务。网页只提供下载和阅读，不执行Python。
[查看文件和哈希]({{ '/assets/examples/agent-mcp-bridge.manifest.json' | relative_url }})。

先在JSON中找到`provider_transport`、`tool_transport`、`session`和
`observations`。默认有两次SDK请求尝试、一次MCP工具调用尝试和一条被
接收观察；最后的`SCRIPTED FIXTURE`文本也是预写的，不是模型生成。

## 宿主填上中间这一跳 {#host}

```text
真实模型SDK + 内存假响应
          ↓ 调用提议
宿主：允许规则 → 整批校验 → 独立预算
          ↓ MCP客户端与真实stdio
本机MCP服务 → 已校验的公开只读函数
          ↓ 结果/错误
宿主：回执检查 → function_call_output → 下一次SDK请求
```

| 文件 | 负责什么 | 不能据此推断什么 |
| --- | --- | --- |
| `provider_fixtures.py` | 复用既有原创预写情景 | 不表示模型推理或远端记录 |
| `bridge.py` | 允许名单、转换、校验、预算与回执 | 不是通用沙箱或任务核实器 |
| `server.py`与纯工具 | 真实协议、三个固定目录读操作 | 不提供道路、私人文件或远端认证 |
| `run_checks.py` | 实际SDK与故障注入的12项检查 | 不是模型分数或课程成绩 |

宿主先核对实际discovery和固定的三个schema，再用**本地可信契约**构造
provider工具定义。服务返回的任意描述不会变成更高权限指令。测试注入
“上传手记”的服务描述，确认它没进入provider请求；这只证明本例的代码
路径，不是任何模型的通用抗注入成绩。`readOnlyHint`也不代替允许规则：
服务进程仍有普通系统能力，不会因为注解、schema或MCP名称成为沙箱。

## 两种关联，不能互换 {#ids}

`function_call.call_id`属于模型API信封。宿主调用MCP后，把**对应结果**
放进同一个provider `call_id`的`function_call_output`，交给下一次SDK请求。
MCP SDK另外管理协议请求/响应的关联。它们是不同的消息空间，本例不
捏造SDK没有暴露的协议ID；报告的`provider_call_id`只陈述这一层。

必要的provider响应上下文，包括加密reasoning状态，仍带给下一次请求，
但不会写进公开trace，原始问题也不进入报告。**不显示隐藏推理不等于
所有返回内容天然都可公开**。真实接入还须检查隐私、工具内容、追踪与
保留期限；本包只用公开目录和合成提问。

## 数清尝试与已接收结果 {#budgets}

先运行批量情景，再只允许一次MCP工具调用：

```sh
python demo_bridge.py --scenario batch
python demo_bridge.py --scenario batch --max-calls 1
```

| 字段 | 本例含义 |
| --- | --- |
| `provider_requests_attempted` | 尝试的SDK请求数；不是计费记录 |
| `mcp_call_attempts` | 客户端协议工具调用尝试数；不冒充服务端执行次数 |
| `receipts_accepted` | 返回对象通过本例参考检查，被接收为观察的数量 |
| `receipts_rejected` | 返回对象被本例内容/参考检查拒绝的数量 |
| `mcp_failures` | SDK在传输、协议或输出schema层抛错，未被接成观察 |

完整情景一次提议含两个工具，所以两次SDK请求和两次MCP尝试不等于
两轮提议。上限1时只保留第一条观察；第二个工具没有结果，不再请求
最终文本。`budget_exhausted`、`answer:null`和退出码1是预期状态。

宿主在任何MCP调用前校验**整批提议**。第二个是未允许的`publish_notes`
时，整批在零MCP尝试时拒绝，不能先执行第一个再查第二个。仅支持新ID、
直接、同步调用，其他形态不会悄悄当作已支持。两个预算均可1–8整数，
单次`max_output_tokens=512`不是全任务token、费用或完整耗时预算。

## 正确形状，还要过参考检查 {#receipts}

SDK解析协议并检查输出schema。宿主再看`is_error`、文字JSON与结构值
是否一致，最后与同一小目录的确定性本地结果完全对照。这份狭窄参考
适合本例三个只读函数，不是通用MCP事实核查机制。

测试注入缺字段、文字/结构不符和形状正确的999米距离。第一种在SDK层
失败，后两种在宿主层拒绝，没有第二次provider请求或假答案。正常两
代表点约1020.225507米，另用独立acos公式、0.001米数值容差核对；
容差是程序检查，不是地点资料或现实导航的精度。

相同结果也不能证明服务内部怎样执行，更不替代现实来源核实。目录仍
是六个WGS84代表点、2026-11-02核对日；食堂匹配0不表示现实没有食堂。
最终文本即使返回，仍是`answer_fact_checked:false`。

通用`BridgeRun`不知道调用者provider是否真的做了推理，`model_called`
为`null`；只有本包明确使用内存假传输的演练才设`false`。替换客户端后
不能继续沿用“没有模型”标签。

## 停止之后，留下什么 {#cancel}

检查程序在第一条观察接收后，让第二次预写请求等待，再取消任务。取消
异常向调用者传播；`BridgeRun.report`保留第一条观察，状态是`cancelled`，
不把已做的读操作描述为撤销，也不补最终答案。

外层20秒等待、MCP读取5秒、SDK请求15秒是不同层的协作超时，不保证
任意系统在精确墙钟时刻结束，资源关闭也需时间。Ctrl+C时CLI明确提示
停止，没有伪造“已完成”JSON。若要自动保存部分报告，需要在自己的宿主
明确设计保存/隐私策略，不应默认上传整段对话。

## 用一个反例，检查理解 {#practice}

选一个改动，先预测，再运行并解释检查层：

1. `batch --max-calls 1`：哪些计数是1，哪个结果不存在？
2. `wrong-type`：字符串半径在哪层被拒绝，为什么没有MCP尝试？
3. `empty`：返回空集合，为什么仍不能写“现实没有食堂”？
4. `repeating --max-requests 2`：两条观察之后为何仍无答案？

可保存一份**公开演练结果**，再到文末用自己的话解释，无需交出私人
提问、Key或学习手记；下载与运行不会自动记完成。暂不装Python可对照
[逐步循环实验]({{ '/playground/agent-runtime/' | relative_url }})：它是脚本和
原生JS函数，没有MCP，两种实现的边界保持清楚。

## 来源与实测边界 {#sources}

2026-11-14使用以下固定版本的相关范围，原创例子未复制SDK实现：

- OpenAI Python3.50.0固定[59738a2](https://github.com/openai/openai-python/tree/59738a289ee82c7b86bf1e10230cceb6daa9716d)：README异步客户端、实际AsyncOpenAI/Responses接口与完整Apache2许可。
- MCP Python SDK2.3.0固定[2118f14](https://github.com/modelcontextprotocol/python-sdk/tree/2118f14f8a19bc158d8a1cf90af58d85d187f849)：前篇记录的发现、stdio、低层回调、错误/结构化输出与完整MIT许可。
- httpx2 2.16.0固定[6bfbf29](https://github.com/pydantic/httpx2/tree/6bfbf296bd87891287b3b0335493c7317be4ef18)：实际异步MockTransport handler接口和完整BSD3许可。

实际检查含真实stdio正常路径、SDK内存层故障注入和真实ZIP/CLI。12项
通过说明这组契约，不是模型能力或通用抗注入认证。没有真实模型、远端
MCP/账号认证、私有文件接入、其他宿主或生产部署验证。
