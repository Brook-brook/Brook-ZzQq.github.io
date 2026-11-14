---
layout: atlas
title: 第一次模型调用，除了 prompt 还有什么？
date: 2026-11-13
category: AI Development
kind: tutorial
ai_assisted: true
tags: [API, Responses, Python, JSON Schema, structured output, timeout, retry, AI 开发]
summary: 为输入、状态、异常和结构化输出建立契约；附可下载的本地 Python 例子，明确离线测试与真实模型调用的区别。
toc:
  - {id: contract, label: 四层契约}
  - {id: response, label: 完成、拒绝与不足}
  - {id: failures, label: 失败不等于重试}
  - {id: example, label: 本地 Python 例子}
  - {id: structured, label: JSON 形状不等于事实}
  - {id: sources, label: 来源与范围}
---

本笔记及示例由 AI 辅助、独立编写。参考 OpenAI Python SDK 的固定公开版本，
但不要求先选定这家服务；消息格式、状态与能力支持要查各自实际接口。
此网站没有收集 API Key，也没有在浏览器发起付费模型请求。

## 一次请求至少有四层契约 {#contract}

API 是程序之间约定的交互接口；SDK 是帮助你使用接口的开发库。Python
SDK运行在自己的程序中，模型服务通常运行在远端；安装库不等于已经有
模型、账号权限或免费调用额度。

1. **输入契约**：模型标识、允许输入、长度/模态、指令与资料如何分开。
2. **传输契约**：认证在何处、超时/重试、限流和连接中断如何反馈。
3. **输出契约**：完整完成、拒绝、不完整、工具请求和空内容如何区分。
4. **业务契约**：内容是否满足原任务，引用可否回查，是否允许执行动作。

HTTP成功、JSON可解析、符合schema和回答正确，不是同一关。SDK省去部分
传输工作，不会替应用定义所有业务判断。

## 不要只读取第一段文字 {#response}

输出可能包含多个项目，而不仅是 `output[0]`。工具请求也不是回答正文。
在所参考的 Responses 接口中，应分别检查响应状态和输出项目；汇总文本
字段便于使用，但不能替代拒绝或不完整状态检查。

| 情况 | 应用应表达什么 | 不应该表达什么 |
| --- | --- | --- |
| 完成且有文本 | 展示结果，仍需任务层核对 | “服务完成所以事实已验证” |
| 拒绝内容 | 明确未提供这次回答 | 把缺失字段填成成功 |
| 不完整/额度用尽 | 保留不足状态，决定是否重新请求 | 把截断JSON强行修成结论 |
| 工具调用 | 验证并由应用决定是否执行 | 把函数名当成已执行证据 |
| 空文本或未知项目 | 按当前契约处理并保留诊断标识 | 随意抓一个字符串冒充正文 |

流式输出是逐步收到事件，不等于更高准确率。已经展示一半后断线，再次
请求可能产生另一份内容；不能把第二次开头直接拼到第一次末尾。

## 超时、限流、认证错误，不能统一无限重试 {#failures}

认证/参数错误通常需要修正配置或输入；限流与部分服务错误可在允许条件下
有限退避。网络超时也不能证明服务端没有处理请求，尤其是涉及付费或写入
动作时。重试策略要考虑预算、幂等性和用户是否允许再次执行。

固定 SDK 版本默认会重试部分错误；例子主动设置 `max_retries=0`，让一次
教学调用的行为明确。`timeout=15.0` 是传输超时配置，不是整个应用绝对15秒
截止时间；真实总截止、取消和多次重试预算需要应用另外管理。

日志先保留错误类别、状态和 request ID。不要默认把认证头、完整输入、
个人资料或所有工具回执送进遥测。`store=False` 只控制该接口相应存储行为，
不能据此声称服务绝不保留任何数据；还要核对实际账户与服务政策。

## 一个在本地运行的 Python 例子 {#example}

<a href="{{ '/assets/examples/ai_request.py' | relative_url }}" download="ai_request.py">下载原创 ai_request.py</a>。
需要 Python 3.10+、例子所核对的 `openai==3.50.0`，以及你自行配置且有权限
使用的 `OPENAI_API_KEY` 和 `OPENAI_MODEL`。Key只在自己的本地/服务端环境
配置，不放到网页、源码、URL或公开仓库。模型是否支持这些参数要另行确认。

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install 'openai==3.50.0'
# 在自己的环境中配置上述两个变量；不要把真实值提交到 Git。
python ai_request.py '用一个例子解释训练和推理的区别'
```

示例把调用封装为接收 client 的函数，先检查完成/拒绝/空输出，再返回文本
和请求标识。仓库的测试使用**真实SDK加完全离线的假传输**，核对序列化、
状态和异常处理；没有使用真实凭据、联网调用模型或把假文本说成模型输出。
打开或下载 `.py` 不会让 GitHub Pages 执行 Python。

## Schema 约束形状，不替你核查事实 {#structured}

设一个原创目录查询格式：`{"place_id":"library","distance_m":120}`。
即使 schema 要求字段齐全、距离非负，120也可能不是实际计算结果，ID也
可能不属于允许目录。还需要集合成员检查、单位检查、实际工具证据及授权。

区分三种东西：提示模型“请输出JSON”、服务端支持的结构化生成约束、应用
收到数据后的验证。它们提供不同保障；支持的schema子集、拒绝处理与
解析辅助也依赖接口版本。[工具实验]({{ "/playground/tool-calling/" | relative_url }})可以实际
修改数值/字符串和未开放工具，体会解析成功为什么还不够。

自检：合法字段 `distance_m: 120` 与实际回执不一致时，哪一层应该拒绝？
如果输出完整且schema正确，却引用不存在的文献，又应该在哪一层发现？

## 实际阅读来源 {#sources}

2026-11-13 固定 `openai/openai-python` 提交
`59738a289ee82c7b86bf1e10230cceb6daa9716d`：

- [README：Usage / Handling errors / Retries / Timeouts / Request IDs](https://github.com/openai/openai-python/blob/59738a289ee82c7b86bf1e10230cceb6daa9716d/README.md)。
- [Responses 结构化解析示例](https://github.com/openai/openai-python/blob/59738a289ee82c7b86bf1e10230cceb6daa9716d/examples/responses/structured_outputs.py)，只对照接口，不复制示例实现或声称已验证真实模型schema能力。
- [实际许可](https://github.com/openai/openai-python/blob/59738a289ee82c7b86bf1e10230cceb6daa9716d/LICENSE)：Apache-2.0，完整文本保留在开源致谢所列文件。

不要把本页固定版本当作永远最新接口；升级应重跑自己的契约与回归测试。
