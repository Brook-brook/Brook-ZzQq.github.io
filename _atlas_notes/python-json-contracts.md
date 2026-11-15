---
layout: atlas
title: JSON 能解析，还缺哪一步？
date: 2026-11-15
category: Python
kind: tutorial
ai_assisted: true
tags: [Python, JSON, 类型, 异常, API, 契约, AI开发, Agent开发]
summary: 真实解析文本、核对Python类型与应用范围；用同一份浏览器和标准库源码，观察布尔值、重复键和非有限数在哪里被拒绝。
lab_url: /playground/python/
download:
  path: /assets/examples/api-foundations.zip
  filename: brook-api-foundations.zip
  label: 下载 API 基础练习
  detail: 本机Python3.11+，仅标准库；JSON可在网页运行，HTTP部分需在本机运行。
toc:
  - {id: run, label: 先跑四个例子}
  - {id: values, label: 文本与Python值}
  - {id: contract, label: 解析之后的契约}
  - {id: edge, label: 重复键与非有限数}
  - {id: local, label: 回到自己的项目}
  - {id: sources, label: 来源与边界}
---

模型返回了一段JSON，程序就可以信任和执行吗？先把这件事拆小：文本
是否能解析，解析出了什么类型，它是否满足**本应用**允许的输入。这里
的原创AI辅助练习真实执行Python，没有模型或任意工具执行接口。

## 先跑四个例子 {#run}

打开[预选JSON例子的Python实验]({{ '/playground/python/#json-contracts' | relative_url }})，
自己点击加载、运行。网页和下载包使用同一份`json_contracts.py`及公开
例子；结果由函数计算，四行JSON不是预写答案。预选只选源码，不自动
下载解释器、执行或记录学习进度。

默认得到一次`total:6`，另三例分别被拒绝。把`true`改成`1`，再改成
`"1"`，先预测接受情况，再核对输出。原有四个示例仍可选择。

## 文本、字节与Python值 {#values}

JSON是数据交换格式。`json.loads()`接收JSON文本并产生Python值；
Python字典不是一段JSON文本。`json.dumps()`做相反方向的序列化。

| JSON中的值 | Python解析结果 |
| --- | --- |
| object、array | `dict`、`list` |
| string | `str` |
| number | 通常是`int`或`float`，可由解析参数改变 |
| true、false | `True`、`False`，类型是`bool` |
| null | `None` |

```python
import json
text = '{"label":"学习"}'
data = json.loads(text)
print(type(text).__name__, type(data).__name__)
print(len(text), len(text.encode("utf-8")))
```

字符数与UTF8字节数可能不同；两者也都不是模型token数。这段只用来
观察编码，不满足下方的加和契约。HTTP部分收到的是字节，会先核对
媒体类型、大小和UTF8解码，再交给JSON核心。

## 解析之后，还要检查什么 {#contract}

本例只接受这三个字段，约定由应用自己明确选择：

```json
{"schema_version":1,"task":"sum","values":[1,2,3]}
```

`schema_version`必须是整数1，`task`只能是字符串`sum`，`values`必须是
1–8个有限数，每个在−1000到1000之间。拒绝未知字段，不把空列表、
字符串或布尔值静默转换为数字。这里不是任意JSON Schema验证器。

Python里`isinstance(True, int)`为真，`True == 1`也为真。因此只写
`isinstance(value, int)`，会误把布尔值当版本号或数量。这个窄契约使用
精确类型检查；小数仍按浮点数处理，不声称十进制运算永远精确。

输出的`total`是这些已允许数值的实际加和。它不能证明输入来自可信
来源、符合你的真实任务，也不会因为`task`这个名字而获得执行权限。

## 重复键，与两种非有限数 {#edge}

Python默认JSON解析器接受重复名称并留下最后一个值，也接受NaN和
Infinity扩展。本例主动选择更严格的应用策略：重复名称即拒绝，用
`parse_constant`拒绝这些非标准数。不要把该策略说成所有解析器的行为。

把同一个`task`写两遍，即使值相同也得到`duplicate_name`。`NaN`得到
`nonstandard_number`；`1e309`是可解析的数值写法，但可溢出为非有限float，
要在数值契约里另外拒绝。只拦截NaN字符串不够。

文档最多2048个UTF8字节，是此项目的教学边界。精确上限包含空白；
等于上限可过大小检查，再多一个字节就拒绝。它不是通用解析器的安全
证明，也不是模型上下文或API服务的通用限制。错误码不回显整段输入，
仍不能把任意调用程序和日志当作通用脱敏器。

## 回到自己的项目 {#local}

下载并解压进入`brooks-api-foundations`，按README运行：

```sh
python3 demo_json.py
python3 run_checks.py
```

仅需Python3.11+标准库，无pip或Key。把某个错误输入改成你自己的公开
小例子，并写出“哪一层应该拒绝、可观察结果是什么”。不要把私人手记、
凭据或不明来源资料放进公开练习文件。

理解这一层后，可读[真实HTTP练习](../http-response-boundaries/)，再回到
[第一次模型请求](../model-request-contracts/)与[只读Agent搭建](../agent-project-starter/)。
解析、协议、权限、来源与最终任务验收仍是不同的检查。

## 实际来源与范围 {#sources}

2026-11-15核对CPython3.11.18固定
`26badd80b6dc7786cd8fb63c3608a31f04754219`的
[json文档](https://github.com/python/cpython/blob/26badd80b6dc7786cd8fb63c3608a31f04754219/Doc/library/json.rst)：
转换表、`object_pairs_hook`、`parse_constant`、重复名称、NaN及编码。
示例和输入均原创；没有复制上游实现。Python及其文档的完整实际许可
随包保留，原创程序MIT。网页执行的是现有Pyodide，不等于完整本机Python。
