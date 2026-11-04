---
layout: atlas
title: "把 RSS 条目整理成可核对的 JSON"
summary: "自己定义 URL 相等规则，观察重复、缺失和错误如何影响一份研究记录。"
description: "RSS 与 Atom 本地解析、URL 规范化和去重教程，连接可运行的浏览器实验。"
kind: tutorial
ai_assisted: true
category: "Data"
tags: [RSS, Atom, JSON, normalization]
date: 2026-11-04
section: Study
lab_url: /playground/research/
sources:
  - title: RSS 2.0 规范
    url: https://www.rssboard.org/rss-specification
  - title: Atom 格式 RFC 4287
    url: https://www.rfc-editor.org/rfc/rfc4287
  - title: URL 标准
    url: https://url.spec.whatwg.org/
toc:
  - id: formats
    label: 先区分三种数据
  - id: identity
    label: 定义什么叫重复
  - id: experiment
    label: 动手修改输入
  - id: limits
    label: 输出仍需要判断
---

## 先区分三种数据 {#formats}

OPML 常用于组织订阅源目录；RSS 和 Atom 用于表达订阅条目。拿到一份源列表，不等于已经取得文章，也不意味着得到全文转载授权。

实验从自编 XML 开始：RSS 2.0 的 `item` 或标准命名空间 Atom 的 `entry` 提供标题和链接，再映射为统一记录。这里练习字段与错误处理，不连接新闻网站，也不抓取文章正文。

## 定义什么叫重复 {#identity}

去重之前，先说清“相同”的含义。两条链接可能指向同一地址，也可能恰好有相同标题。

```text
https://example.test/note?id=1&utm_source=lab#section
https://example.test/note?id=1
https://example.test/note?id=2
```

在这个实验的规则下，片段 `#section` 不参与条目标识；可选择移除常见跟踪参数。开启后，前两条可归到同一规范 URL，第三条仍是不同记录。不要删除所有 query：`id=1` 与 `id=2` 可能对应不同资源。

规则也不能无限推广。查询参数顺序有时带有语义，实验保留剩余参数的顺序；真实来源需要自己的规范化策略。URL 相同可以判为链接重复，URL 不同却不保证内容不同，本实验不做正文指纹或语义去重。

## 动手修改输入 {#experiment}

[打开 RSS 去重实验]({{ '/playground/research/' | relative_url }})，依次尝试：

1. 运行一份示例，检查每条记录为什么保留、重复或无效。
2. 切换跟踪参数选项，比较保留条目和规范 URL。
3. 把 `id=2` 改为 `id=1`，再次运行，观察唯一记录数量。
4. 删除标题或损坏 XML，区分条目缺字段与整个文档无法解析。
5. 检查 JSON，再导出。修改输入后需要重新运行，不能把旧结果当作新输入的分析。

页面只在当前浏览器中处理文本。示例使用 `example.test` 的自编练习条目，不是真实论文或校园数据；没有网络抓取、AI 调用、账户或上传过程。这个页面运行原生 JavaScript，不是在线 Python 解释器。

## 输出仍需要判断 {#limits}

JSON 的形状清楚，便于交给下一个工具，但解析成功不证明文章可信。没有调用模型时，`summary` 和 `score` 保持 `null`；`review_status` 为 `needs_review`，不能自动升级成“已复核”。

页面接受 RSS 2.0 与标准 Atom 的有限子集，不覆盖所有扩展；相对链接、异常日期、全文清洗和真实站点的条件请求需要另行设计。将来加入模型时，还应记录输入版本、错误、引用与费用，让模型辅助阅读，而不是替作者批准结论。

在 [BestBlogs 源码研究]({{ '/knowledge/bestblogs-research/' | relative_url }}) 中，可以继续看“格式有效”“源码可见”和“线上已验证”为什么是不同的判断。
