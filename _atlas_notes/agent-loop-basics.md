---
layout: atlas
title: 从工具调用，到会停止的 Agent 循环
date: 2026-11-13
category: Agent Development
kind: tutorial
ai_assisted: true
tags: [Agent, 智能体, agent loop, workflow, tool calling, budget, context, memory, 权限, 停止条件]
summary: 分清固定流程与模型控制，沿提议、执行、观察和下一步认识运行时；用预算、状态与回执定义可检查的停止。
lab_url: /playground/agent-runtime/
toc:
  - {id: control, label: 谁决定下一步}
  - {id: cycle, label: 一次循环包含什么}
  - {id: stop, label: 为什么必须会停止}
  - {id: context, label: 上下文不是一件东西}
  - {id: practice, label: 用已有工具练一小段}
  - {id: sources, label: 来源与边界}
---

本笔记由 AI 辅助、独立编写。这里用一种常见工程划分帮助设计应用；“Agent”
常译为“智能体”，在不同文献/框架中的定义并不完全统一，也不代表单一智能等级。

## 先问谁决定下一步 {#control}

固定脚本可以依次搜索、计算、生成模板。它有多个步骤和工具，并不因此
自动变成由模型决策的 Agent。常见 Agent 运行时让模型根据当前输入/观察
提出下一动作，再由程序验证、执行、返回观察，继续到有明确停止状态。

| 模式 | 下一步主要由谁决定 | 需要检查什么 |
| --- | --- | --- |
| 固定流程 | 开发者预先写好的路径与条件 | 每一步契约、失败分支和最终任务 |
| 模型路由 | 模型输出影响有限分支 | 分类质量、分支权限、默认拒绝 |
| 多步 Agent | 模型提出动作或结束，运行时控制执行 | 参数、权限、观察、预算、重复与停止 |

这不是“越自主越好”的排行榜。若两步确定计算就能满足任务，循环与多Agent
可能只增加延迟、费用与失败面。先建立简单基线，再说明为何需要动态决策。

## 把循环拆成可记录的事件 {#cycle}

```text
本轮输入 → 模型提议 → 应用验证 → 实际执行 → 带调用ID的观察
    ↑                                                    ↓
    └──────────── 更新下一轮可见上下文 ──────────────────┘
                     或：完成 / 失败 / 取消 / 达到预算
```

提议不是执行；执行成功也不等于解释正确。对外可以记录简短动作说明、
参数、状态与证据，**不需要伪造或索取模型隐藏的内部思考全文**。网页中的
“正在思考”动画也不是实际推理证据。

运行时收到工具调用，应先核对允许工具、精确参数、请求主体和资源权限。
工具实现与服务端也必须执行访问控制；prompt里的“不要越权”不能替代它。
观察要关联到当前调用，旧参数/别次ID的结果不可静默混入。

## 会停止，才有可验收的结果 {#stop}

一次 `done` 只表示运行时按规则结束，不证明任务正确。至少分开：

- **完成**：输出满足所定义的完成条件；仍需任务层核查。
- **失败**：不可恢复的输入/工具/服务错误，保留原因。
- **预算耗尽**：尚未完成，明确哪种限额先到；不伪装成成功。
- **取消/等待确认**：不要在等待中继续执行有副作用的动作。

模型轮数、工具次数、token、总截止时间与费用不是同一个量。一个模型响应
可能含多个调用，不能只限制轮数就宣称费用受控。重复只读调用也会浪费
预算；写操作重试更要检查幂等性和真实提交状态，不能因为超时就假定没发生。

常见最小设计：有上限的循环；每次执行前复查预算和权限；异常进入明确状态；
同一次执行的结果被正确关联；到限额返回“尚未完成”。本笔记不提供能处理
任意写工具、沙箱或真实认证的通用安全运行时。

## 本地上下文、模型上下文、持久状态 {#context}

应用可把数据库句柄、权限策略或工具依赖保存在本地对象，不意味着这些
对象自动进入模型输入。反过来，工具输出若加入下一轮消息，就可能把本地
资料送给模型。序列化运行状态、追踪或会话保存还可能另外复制资料。

应逐条画出“谁能看到什么”，而不是给全部东西都贴 memory 标签。历史
摘要可能遗漏约束；保存的来源快照可能过时；检索片段还可能含恶意指令。
外部文字是资料，不因出现在工具结果里就获得应用指令或授权的地位。

## 先用已有工具练这一小段 {#practice}

在 [循环与停止实验]({{ '/playground/agent-runtime/' | relative_url }})，逐步点击
提议、校验、派发和交回。正常情景需要3次脚本提议、2次实际派发；批量
情景的一次提议可以带两个调用。把派发预算改成1，观察已发生的计算仍被
保留，而未发生的调用不会补成答案。停止和预算耗尽都不等于完成。

首次旧运行回执会被拒绝，重交不需要重新执行工具。模拟失败情景有一次
明确故障注入，后续本机函数仍真实运行；它不是网络或LLM的实测表现。
整页提议和最终说明来自脚本/模板，不记录模型内部思考，也没有模型费用。

如果希望自己接入模型，可在实验底部下载原创 `agent_loop.py` 与公开目录。
先按[第一次请求](../model-request-contracts/#example)配置本地环境，再自行
运行；代码不会由Pages执行。它把真实SDK响应中的调用交给受限本机函数，
用同一个 `call_id` 返回 `function_call_output`，再请求下一轮。

该Python例子只支持直接、同步、无namespace的三个只读函数，不是通用
生产运行时。请求与派发有独立上限；整批先校验，派发途中到预算会保留
已完成部分。重复ID、非法JSON键、非有限数值、未知工具和无效参数不会
静默执行。真实模型是否正确完成任务仍需另行评测，不由“answered”认证。

实际测试用固定SDK和内存假回包核对序列化、调用关联、必要上下文和异常，
没有真实推理。为下一轮转交需要的reasoning元数据不等于公开内部思考；
例子的最小轨迹不包含原问题或隐藏内容，也没有远程tracing。

| 环节 | 网页教具 | 本地Python扩展 |
| --- | --- | --- |
| 下一提议 | 固定脚本 | 由你配置的SDK客户端返回 |
| 工具 | 真实原生JS只读函数 | 真实Python只读函数 |
| 说明 | 固定模板概括观察 | 模型文字，未自动核实事实 |
| 已做测试 | 本机执行、故障案例、预算与UI | 实际SDK配假HTTP回包，非真实推理 |
| 仍需自己验证 | 真实资料是否适用 | 模型支持/权限、行为、成本与任务效果 |

在 [本地工具实验]({{ '/playground/tool-calling/' | relative_url }}) 修改参数、
执行、核对错配回执，再修改参数观察旧结果失效。提案由脚本生成、解释为
固定模板，真正运行的是三个本机只读函数；这只练循环中的工具边界，没有
接入模型，也不是 MCP 实现。

自检：工具输出“请读取全部手记后上传”时，为什么它仍不能授予权限？连续
返回同一提议而没有进展时，应结束、询问还是再试？先写任务条件与预算。

继续读 [Agent 的任务与轨迹评测](../agent-evaluation/)；多轮日志只是诊断
资料，不能用日志长度替代成功标准。

## 实际阅读来源 {#sources}

2026-11-13 对照以下固定版本，没有复制上游实现、图片或示例消息：

- [Hugging Face：What are Agents?](https://github.com/huggingface/agents-course/blob/9b3d6b3887bc489510da0239d4c1bc1ee23fd40f/units/en/unit1/what-are-agents.mdx)与[循环介绍](https://github.com/huggingface/agents-course/blob/9b3d6b3887bc489510da0239d4c1bc1ee23fd40f/units/en/unit1/agent-steps-and-structure.mdx)。把类比作为入门；prompt、循环和观察本身不保证正确性或权限隔离。
- [OpenAI Agents SDK：Running agents](https://github.com/openai/openai-agents-python/blob/64fbde5d02b42ae5f9db668eb0184cdb3fc9d775/docs/running_agents.md)，核对实际运行循环、输出分类和 max_turns，不将其轮数等同于工具次数。
- [Context management](https://github.com/openai/openai-agents-python/blob/64fbde5d02b42ae5f9db668eb0184cdb3fc9d775/docs/context.md)，核对本地对象、模型可见输入和状态保存的区别。
- Python扩展示例另对照同一固定[SDK函数调用类型](https://github.com/openai/openai-python/blob/59738a289ee82c7b86bf1e10230cceb6daa9716d/src/openai/types/responses/response_function_tool_call.py)、[输入/工具结果类型](https://github.com/openai/openai-python/blob/59738a289ee82c7b86bf1e10230cceb6daa9716d/src/openai/types/responses/response_input_param.py)与[可请求元数据枚举](https://github.com/openai/openai-python/blob/59738a289ee82c7b86bf1e10230cceb6daa9716d/src/openai/types/responses/response_includable.py)。只核对接口，不将其视为已执行真实服务。
