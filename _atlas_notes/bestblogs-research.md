---
layout: atlas
title: "读 BestBlogs：先把源码与产品描述分开"
summary: "沿一次 CLI 调用与一份 Dify Schema，学习如何给技术判断留下可核对的证据。"
description: "BestBlogs 固定版本的源码研究笔记：评分差异、阅读副作用、结构约束与许可边界。"
kind: research
category: "AI 工程"
tags: [source-review, CLI, structured-output]
date: 2026-11-04
section: Study
source_repo: https://github.com/ginobefun/BestBlogs
source_commit: 756ffbddf5cf4cd87e383a82b7c997563032e93f
analyzed_at: 2026-11-03
review_status: source_checked
reviewed_at: 2026-11-04
ai_assisted: true
sources:
  - title: README 中的评分描述
    url: https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/README.md#L29-L33
  - title: CLI 深度阅读的执行顺序
    url: https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/cli/src/commands/read.ts#L15-L46
  - title: 公开文章工作流的 JSON Schema
    url: https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/flows/Dify/dsl/v4/BestBlogs%20%E6%96%87%E7%AB%A0%E5%88%86%E6%9E%90%E6%B5%81%E7%A8%8B.yml#L433-L499
toc:
  - id: trace
    label: 从调用链开始
  - id: evidence
    label: 给结论分级
  - id: contract
    label: 检查结构与副作用
  - id: transfer
    label: 适合迁移什么
---

## 从调用链开始 {#trace}

研究开源项目时，先固定 Commit，再追踪一个具体动作：参数进入哪个命令，发出什么请求，结果怎样校验，失败后怎样退出。这里分析的是 `756ffbdd` 快照，而不是对 BestBlogs 当前线上状态的承诺。

公开 CLI 值得学习的是命令、API 包装、编排与归一化的分层。生产后端没有完整公开，不能因为客户端能调用服务，就认定完整产品可以本地复现。

## 给结论分级 {#evidence}

这份笔记用四种证据等级，避免把“写在介绍里”当成“运行验证过”：

| 等级 | 能说明什么 | 本次例子 |
| --- | --- | --- |
| A | 源码或配置直接可见 | CLI 深读默认写入已读记录 |
| B | 官方描述，生产实现未公开 | README 所称的六维评分能力 |
| C | 从代码条件推导 | 某项 Schema 约束不足可能放过错误值 |
| D | 当前无法验证 | 生产模型版本、实时效果与完整费用 |

一个实际差异是：README 描述选题、内容、深度、实用、创新、表达六维评分；公开 v4 Prompt 却按内容深度 40、相关性 30、实用性 20、创新性 10 分组织。见[评分规则源码](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/flows/Dify/dsl/v4/BestBlogs%20%E6%96%87%E7%AB%A0%E5%88%86%E6%9E%90%E6%B5%81%E7%A8%8B.yml#L305-L329)。能确认材料不一致，不能据此断言线上一定没有六维评分。

## 检查结构与副作用 {#contract}

**结构化不等于正确。** 公开 Schema 的 `mainPoints.items` 同时设置空 `properties` 和 `additionalProperties: false`；按标准 JSON Schema，这种对象只能为空，与 Prompt 期待的观点字段冲突。`score` 的描述写 0–100 整数，实际类型却只是 number，缺少范围与整数约束。模型或 provider 如何处理还需运行验证。

**“读取”也可能写状态。** `read deep` 在取得正文后默认标记已读；`--markdown-only` 只改变输出，预览要明确使用 `--no-mark-read`。设计自己的工具时，应把查询、记录行为和删除操作分开声明，不能只根据命令名字判断权限。

## 适合迁移什么 {#transfer}

先迁移方法：稳定的数据契约、明确的失败、来源记录与人工判断。不要把内容质量分直接当作学习价值；基础教程和理论材料未必新颖，却可能是理解 GIS/AI 的必要前置。

许可也要分范围：[CLI](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/cli/package.json#L55-L61)和 [Skills](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/skills/package.json#L19-L24)有 MIT 声明，根目录没有统一 LICENSE，不能把整仓当 MIT 复制。本笔记使用独立总结与源码定位，没有搬入其实现、Prompt 或图片。

“来源已核对”仅表示本轮借助 AI 对公开证据交叉核对，不代表 Brook 已逐项人工认可，更不代表发布授权。判断仍需阅读原文，代码与网站发布继续通过人工控制的 PR。

继续阅读：[完整七篇研究报告](https://github.com/Brook-brook/Brook-ZzQq.github.io/tree/3d49c7f1b374184a1de5886880da116e31c2beba/docs/research/bestblogs)。动手练习：[把 RSS 条目整理成可核对的 JSON]({{ '/knowledge/rss-normalization/' | relative_url }})。
