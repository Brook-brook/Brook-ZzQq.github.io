---
layout: atlas
title: 先把一次 HTTP 看清楚
date: 2026-11-15
category: AI Development
kind: tutorial
ai_assisted: true
tags: [HTTP, API, Python, JSON, timeout, Retry-After, 状态码, AI开发, Agent开发]
summary: 用真实本机HTTP区分传输、状态、正文与应用契约，观察200坏JSON、204无内容、限流、重定向和超时；不给未收到的结果补结论。
download:
  path: /assets/examples/api-foundations.zip
  filename: brook-api-foundations.zip
  label: 下载 API 基础练习
  detail: 本机Python3.11+，仅标准库；真实HTTP仅连接短时本机fixture，无模型Key。
toc:
  - {id: run, label: 实际跑一次HTTP}
  - {id: layers, label: 分清四个检查层}
  - {id: status, label: 状态与正文的关系}
  - {id: timeout, label: 超时不等于没有处理}
  - {id: adapt, label: 回到模型与工具}
  - {id: sources, label: 来源与许可}
---

安装SDK之前，先看懂它替你发送的请求。本篇原创AI辅助练习只用标准
库：返回内容和故障由教学脚本安排，HTTP客户端、服务与socket真正运行。
它没有连接公开API或模型，也不把故障情景说成互联网服务实测。

## 实际跑一次HTTP {#run}

解压进入`brooks-api-foundations`，在自己的Python3.11+运行：

```sh
python3 demo_http.py
python3 run_checks.py
```

程序短时启动绑定`127.0.0.1`临时端口的服务，顺序请求11个固定案例，
退出时关闭。没有任意URL、目录浏览、账户或文件读取接口，也不自动
重试或跟随重定向。不需要pip或Key；本机HTTP部分不能在Pages或当前
浏览器Pyodide中执行。[JSON部分可在网页真实运行](../python-json-contracts/)。

## 一份输出，四个检查层 {#layers}

`response_headers_received`只说明客户端收到了响应头，不保证正文完整。
`http_status`是实际读到的状态码；未知时保留`null`。`stage`和固定错误码
帮助定位，而不是替未知结果编出一个成功或失败原因。

<div class="note-evidence-scroll" role="group" tabindex="0" aria-label="HTTP检查层，可横向滚动" markdown="1">

| 层 | 本例核对什么 | 单独通过还不能说明什么 |
| --- | --- | --- |
| transport | 本次连接、请求和响应头 | 没超时不保证数据正确；超时不保证服务端未收到 |
| http | 实际状态和短诊断字段 | 200不保证正文可用；204也不是传输失败 |
| representation / json | 媒体类型、大小、UTF8与严格解析策略 | 可解析不保证类型、来源或业务正确 |
| contract / computed | 精确字段与允许数值，再实际加和 | 程序结果不替你验收外部任务或授权动作 |

</div>

窄屏可滚动这张表，键盘聚焦后用方向键。客户端读取正文最多2049字节：
前2048是应用上限，多读一个用于发现超限；不会为了报错下载整个大正文。
本例只接受`application/json`、UTF8和未压缩内容，是有意收窄的契约，
不是宣布其他合法HTTP表示都不正确。

## 状态码与正文，不要混成一关 {#status}

`valid`得到`total:6`；`bad-json`也返回200，却停在JSON层；`wrong-type`
解析成功，但布尔值在应用契约拒绝。`wrong-media`更早停在表示层。

204表示请求成功完成且没有额外响应内容，不应再尝试从它解析JSON。
它也不能带Content-Length；本机检查实际核对这一点。本应用期望JSON
输入，因此记录`expected_json_absent`，而不是偷偷补一个数值0。

429表示请求过多，503表示暂不可用。本例保留`Retry-After:"5"`这一短
字段，不自动等待或重试。该字段也可以是HTTP日期，不能一概当成秒数。
是否重新请求，还要看服务约定、预算、幂等性和允许的操作。

302案例指向本机`valid`，客户端仍只发一次请求；检查核对服务收到的
完整路径序列，确认没有暗中跟随。`http_requests_attempted`是客户端尝试
数量，不能在任意网络上当作服务端执行次数或费用。

## 超时，保留未知 {#timeout}

`disconnect`在响应头前主动断开；`timeout`在服务端用Event保持等待，
客户端实际触发阻塞操作超时。故障是显式注入，网络交互不是预写日志。
这两例都不能给出完整JSON，结果保持`null`。

`timeout`参数限制阻塞操作，不等于多次连接、读取和重试的整项任务
绝对截止。真实应用若需要总预算，应另用适合的单调时间、取消与状态
控制，并测试部分结果。不能把“我没收到”直接改写成“对方没做”。

幂等也不要求每次响应完全相同：它关心多次相同请求的预期效果是否
等同一次，日志仍可能增加。尤其重试写操作时，HTTP方法名、随便加的
key或一段prompt都不足以替代服务端实际支持的契约。

## 回到模型与工具 {#adapt}

先在[回执与重试](../agent-delivery-boundaries/)中对照应用前/后丢失、
同key重发与查询。它补上“收到什么”和“实际发生什么”之间的区别；
网页只执行内存模型，下载项目才实际发送loopback HTTP。

这份窄客户端不处理真实服务的HTTPS认证、账户权限、流式消息、完整
任务截止或持久状态。`http.server`不适合作生产服务；练习只在自己的
loopback短时运行，不应对外公开。临时端口也不认证对方身份。

之后再读[模型请求契约](../model-request-contracts/)，对照SDK默认重试、
拒绝/不足和request ID。用[共同GIS案例](../agent-interface-evidence/)检查
为什么HTTP、schema与数值都正确，最终“步行路线”的解释仍可能越界。

## 实际来源与许可 {#sources}

2026-11-15实际核对：

- [HTTPWG RFC9110固定源码](https://github.com/httpwg/http-core/blob/bde37f634681bd5462568b73aa722af9c9a3ef5e/rfc9110.xml)，9.2.2幂等、8.6 Content-Length、10.2.3 Retry-After、15.3.5 204。规范2022年发布，不是本项目的新协议。
- [CPython3.11.18 http.client](https://github.com/python/cpython/blob/26badd80b6dc7786cd8fb63c3608a31f04754219/Doc/library/http.client.rst)，阻塞操作timeout与本机能力范围。
- [http.server](https://github.com/python/cpython/blob/26badd80b6dc7786cd8fb63c3608a31f04754219/Doc/library/http.server.rst)的生产限制，以及同提交http.rst的429/503状态枚举。

代码与情景原创MIT，CPython实际完整许可随包保留；规范受其IETF Trust/
BCP78等声明约束，没有被统一标成MIT。本页只作原创解释，不复制规范
代码或原文，也不声称完成远端认证、真实模型或生产可靠性验证。
