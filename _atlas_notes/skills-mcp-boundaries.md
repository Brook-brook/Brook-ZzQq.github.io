---
layout: atlas
title: Tool、Skill、MCP：下一步该改哪一层？
date: 2026-11-14
category: Agent Development
kind: tutorial
ai_assisted: true
tags: [Tool Calling, Tool, Skill, Agent Skills, MCP, 智能体, 接口, 权限, workflow, 上下文]
summary: 用同一个校园目录任务，区分操作、可复用工作指引、上下文交换协议与Agent运行时；理解格式、连接和授权各自能保证什么。
toc:
  - {id: layers, label: 四层不同的工作}
  - {id: skill, label: Skill怎样进入上下文}
  - {id: mcp, label: MCP连接的是谁}
  - {id: example, label: 一次只读任务的分工}
  - {id: diagnose, label: 故障应该改哪一层}
  - {id: sources, label: 固定版本与许可}
---

本笔记由AI辅助、独立编写，参考文末固定官方版本。用“从目录里找两座
图书馆并比较球面代表点距离”这个小任务，理解几个经常一起出现的名词。
它们可以协作，各自承担的工作仍要分清。

## 先给每层一个具体问题 {#layers}

| 这一层 | 要回答的问题 |
| --- | --- |
| Tool与Tool Calling | 能执行什么操作，输入、输出与调用关联是什么？ |
| Skill | 这类任务通常怎样做，何时参考哪些指引与资源？ |
| MCP | 应用怎样用约定协议发现、调用或取得外部能力与上下文？ |
| Agent运行时 | 谁决定下一步，保存什么上下文，什么时候停止？ |

一个普通Python函数可以成为工具实现的一部分；模型看到的名称、参数
schema和返回方式则由应用适配。Tool Calling通常让模型输出结构化调用
提议，再由程序检查和执行。模型写出函数名，不意味着函数已经存在或运行。

同一个工具既可以被确定脚本调用，也可以被模型驱动的运行时调用。是否
采用MCP、Skill目录或Agent框架，不能单独证明模型控制、执行成功或任务正确。
可先用 [本机工具实验]({{ '/playground/tool-calling/' | relative_url }}) 核对这条边界。

## Skill是可按需读取的工作指引 {#skill}

Agent Skills格式把元数据、Markdown指引和可选资源组织成目录。最小核心
是 `SKILL.md`，包含YAML frontmatter和正文；规范要求 `name` 与 `description`。
脚本、参考资料和模板可另附，但支持的执行环境仍取决于宿主。

渐进加载通常分三步：先读名称/描述以发现候选，决定使用时读取完整指引，
执行过程中才按需读取资源。文档中的token/行数建议是组织内容的方法，
不是每个模型或客户端都会强制执行的统一限制。

下面是本站独立编写的格式示例，不是从上游复制的Skill：

```yaml
name: catalog-evidence-guide
description: >-
  在只读目录工具可用时，
  查询地点并核对球面距离证据。
license: MIT
```

它的正文应说明前提、步骤、允许数据、异常和验收，而不只是写“你是一名
专家”。<a href="{{ '/assets/examples/catalog-evidence-guide.txt' | relative_url }}" download="SKILL.md">下载完整示例</a>
后，将文件放在 `catalog-evidence-guide/SKILL.md`；文章页面和当前Python客户端
不会自动安装或发现它。这份示例没有捆绑工具、凭据或远程服务。

安装目录或写出 `allowed-tools` 不等于获得资源权限。该字段在所读规范中
仍标为实验性，支持因宿主而异。宿主、工具实现与被访问的服务必须落实
真实授权；一段检索到的外部文本也不会因为文件名叫SKILL.md就自动成为
已批准的工作指令。复用之前仍应检查来源、版本、依赖和实际执行内容。

## MCP让宿主与能力提供方说同一种协议 {#mcp}

按本文固定版本，MCP采用host/client/server架构：host是协调连接的AI应用，
client在host中与某个server通信，server提供能力或上下文。server可以在
本机，也可以在远端；“server”不自动意味着云服务或付费模型。

MCP可提供tools、resources和prompts等原语。tools对应可执行操作，resources
提供资料，prompts提供可复用交互模板。`tools/list`与`tools/call`分别描述
工具发现与调用；协议并不替应用决定怎样组织LLM、选择上下文或控制循环。

模型供应商的工具调用信封与MCP消息不是同一个格式。应用适配层需要保留
各自的请求/调用关联，把模型提议送到真实实现，再把结果转换回模型输入。
MCP的 `structuredContent` 是server产生的结果数据，不等同于模型结构化
生成，也不自动证明结果符合现实。

本节按 **MCP 2026-07-28** 文档讲解。该版本使用每请求元数据和
`server/discover`；不能把旧版initialize/会话示例直接当作这版可运行消息。
实际客户端、server与SDK支持的版本需匹配；本文不提供或宣称已运行一个
MCP实现，也不把一组普通JSON函数包装成协议兼容证据。

## 用同一个任务，串起分工 {#example}

1. 用户提出“比较目录中的两座图书馆”，先确定目录覆盖、来源与距离模型。
2. Skill可以建议先查ID，再计算，再解释单位与限制；它本身不执行距离公式。
3. 运行时产生下一步提议，检查工具、参数与预算。提议可来自脚本或模型，须如实标明。
4. 工具实现运行 `find_places` 与 `measure_distance`。有MCP适配时也必须通过真实实现；没有MCP也可以直接调用本机函数。
5. 当前调用的结果进入观察，下一轮再使用；到预算或证据不足时停止，不补造完成。
6. 最终核对是否回答了原问题、是否把球面代表点误说成步行路线；连接成功不能替代这一步。

[循环实验]({{ '/playground/agent-runtime/' | relative_url }}) 的本机函数真实运行，
提议与说明仍是脚本/模板。下载的Python扩展展示供应商SDK循环，实际验证
仅用离线假HTTP响应；它们都没有被这篇文章升级成MCP服务或Skill加载器。

## 不要用一个名词修理所有故障 {#diagnose}

- **结果来自另一调用**：先检查应用/适配层的ID与回执关联，换一个Skill名称不能修复错配。
- **已下载Skill却没有所需工具**：核对宿主环境与工具注册；正文不能凭空提供实现或授权。
- **能连接server却无权读某资源**：检查实际主体与资源访问控制；schema合法不等于操作获准。
- **工具返回成功，回答却把试用期与正式期混淆**：回到版本、片段条件与任务验收，见 [检索证据实验]({{ '/playground/retrieval/' | relative_url }})。

可以先画一张自己的数据流：哪些资料留在本地，哪些进入模型输入，哪些
被会话或追踪保存。再到 [权限边界自解释]({{ '/study/practice/#agent-permission-boundaries' | relative_url }})
写下你会在哪一层拒绝外部文本提出的越权要求；这不是自动评分。

## 实际阅读的固定版本 {#sources}

2026-11-14 Asia/Shanghai核对：

- Agent Skills：`83021e2be457a9b6679148719c1f6074f0ad975e`，实际阅读[README](https://github.com/agentskills/agentskills/blob/83021e2be457a9b6679148719c1f6074f0ad975e/README.md)和[完整格式规范](https://github.com/agentskills/agentskills/blob/83021e2be457a9b6679148719c1f6074f0ad975e/docs/specification.mdx)。代码Apache-2.0、文档CC-BY-4.0；这里是原创中文解释与新例子，不逐段翻译、复制脚本或使用品牌素材。
- MCP：`06e923405df3df242f1471b9300d9db90ebd10fd`，实际阅读[架构的范围/参与方/层/发现部分](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/06e923405df3df242f1471b9300d9db90ebd10fd/docs/docs/2026-07-28/learn/architecture.mdx)与[完整Tools规范](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/06e923405df3df242f1471b9300d9db90ebd10fd/docs/specification/2026-07-28/server/tools.mdx)，不声称执行官方消息示例或验证客户端互通。
- MCP根README仍写MIT，但实际[LICENSE](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/06e923405df3df242f1471b9300d9db90ebd10fd/LICENSE)说明许可正在迁移：新增代码/规范采用Apache-2.0，未同意迁移的历史贡献仍依原MIT，非规范文档采用CC-BY-4.0。这里保留完整原文，不把仓库统一标成MIT。完整许可与归属见[开源致谢]({{ '/THIRD_PARTY_NOTICES.md' | relative_url }})。

来源固定版本不代表所有客户端已经支持它，也不代表Brook对某个外部服务
作出兼容或安全认证。本站只提供公开读物与明确范围的本机教具。
