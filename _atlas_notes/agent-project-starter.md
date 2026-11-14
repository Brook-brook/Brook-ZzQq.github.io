---
layout: atlas
title: 把一条 Agent 循环，搭成自己能运行的小项目
date: 2026-11-14
category: Agent Development
kind: tutorial
ai_assisted: true
tags: [智能体搭建, Agent, 智能体, Agent搭建, agent building, Python, SDK, 项目结构, 离线演练, MockTransport]
summary: 下载一个可解压运行的只读项目，从文件职责、脚本假回包与真实工具开始，再决定怎样接入自己的模型。
download:
  path: /assets/examples/agent-starter.zip
  filename: brook-agent-starter.zip
  label: 下载原创 Agent 搭建练习包
  detail: Python 3.11+；安装固定依赖后离线演练，无需 API Key。
toc:
  - {id: scope, label: 先确定搭的是什么}
  - {id: files, label: 文件各负责什么}
  - {id: run, label: 解压与第一次运行}
  - {id: observe, label: 读懂一份输出}
  - {id: change, label: 每次只改一个条件}
  - {id: real, label: 再接真实模型}
  - {id: sources, label: 版本与来源}
---

本篇与项目为原创、AI辅助教学材料。先把一个有界的小程序跑对，再讨论
“智能”。你不需要先购买模型额度，也不需要给网页粘贴API Key。

## 这次搭的是哪一部分 {#scope}

目标很小：从已有公开目录比较两个地点的代表点球面距离，保留单位、
来源日期与限制。缺少资料时明确不足，不猜路线；未开放工具在执行前拒绝。

| 层 | 这个小项目里是什么 | 没有因此获得什么 |
| --- | --- | --- |
| 客户端与循环 | 已有`agent_loop.py`，请求、校验、工具、观察和停止 | 任意URL、shell、写工具或通用授权 |
| 模型响应 | 离线demo中的预写假回包；真实模式另由你配置 | 脚本不会理解你的自然语言，也不是模型表现 |
| 工具 | 三个真实Python只读函数 | 完整GIS、道路导航或地点现状核实 |
| 资料 | 六个WGS84代表点和原出处 | 未收录不等于现实不存在 |
| 验收 | 明确状态、计数、数值与来源检查 | 自动事实认证或学习评分 |

固定脚本的下一步由作者安排，它是用来练运行时的教具。真实模型可参与
下一步提议，但参数、权限和执行仍由程序控制；两种模式不要混称。

## 先找每个文件的职责 {#files}

上方可下载完整练习包。压缩包没有第三方库、凭据或用户手记，包含README、源码、公开目录、
六项契约检查、版本要求、完整许可与文件哈希清单。

```text
brooks-agent-starter/
  agent_loop.py       校验、实际工具、循环、预算
  demo_offline.py     脚本假响应，经真实SDK返回
  catalog.json        公开资料及来源
  run_checks.py      契约检查，不给模型打分
  requirements.txt   已核对的SDK版本
  NOTICE.md          数据、代码与依赖边界
  MANIFEST.json      内容哈希，不是签名认证
```

`agent_loop.py`与[循环实验]({{ '/playground/agent-runtime/' | relative_url }})
底部的Python下载取同一源文件。打包器和CI核对源码/ZIP哈希，避免网页例子
已经修好、下载包仍带旧实现。文件哈希只帮助核对内容，不自动证明作者身份、
安全或实际效果。
你也可以[核对文件清单与ZIP哈希]({{ '/assets/examples/agent-starter.manifest.json' | relative_url }})。

## 在自己的电脑第一次运行 {#run}

解压后进入包含README的`brooks-agent-starter`目录。Python需3.11+；
下面为Mac/Linux命令，Windows激活方法见包内README。实际验证为Python3.12；
这里的3.11最低要求来自固定httpx2版本的Requires-Python，不是把原客户端
3.10的语法最低要求当成整个包的兼容性。

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python demo_offline.py
python run_checks.py
```

直接依赖固定为`openai==3.50.0`与`httpx2==2.16.0`。安装需要获准的包索引或已有本地缓存；
**安装后的离线演练**才无需网络与API Key。网页、GitHub Pages和静态HTTP
预览不会执行Python，这也不是Pyodide页面中可直接安装运行的项目。

离线客户端明确传入占位Key、`offline.invalid`与内存`MockTransport`，
没有真实网络回退。不要把占位Key改成真实Key；要用真实模式时另走下文。
`run_checks.py`还会阻止socket连接，六项既定断言全满足时才退出0。

## 不只看最后一行“回答” {#observe}

默认distance情景的JSON里，先找：

1. 顶层`model_called`为false，传输标明内存假回包。
2. `report.requests_attempted`为2，`dispatch_attempts`为1。一次工具提议，
   真正执行一次，再收到脚本文字；“请求次数”不等于“工具次数”。
3. `report.observations[0]`有`call_id`、调用参数与实际球面结果，约
   1020.225507m。检查容差不是现实定位、代表点或导航的精度声明。
4. `status`为answered而`answer_fact_checked`仍为false。程序收到了文本，
   不代表任务已被独立核实。此处文本本来就是作者写的假回包。

先读观察，再看解释是否越界。把代表点球面距离说成“步行距离”，即使
类型、数值、调用ID全对，仍是任务层错误。

## 每次只改一个条件 {#change}

```sh
python demo_offline.py --scenario batch --max-dispatches 1
python demo_offline.py --scenario forbidden
python demo_offline.py --scenario wrong-type
python demo_offline.py --scenario empty
python demo_offline.py --scenario repeating --max-requests 2
```

批量上限1保留实际第一份观察，第二个工具没有执行；重复情景在请求预算
结束时仍没有最终答案。非法工具/类型在派发前失败，不能计为成功执行。
食堂的0匹配仅指当前目录覆盖，不证明现实中不存在。

这些情景的退出码1是预期的“未完成/拒绝”。逐条运行，不用`&&`串成必须
全成功的命令。非法命令参数返回2；契约检查程序的全部断言通过才返回0。

想先免安装观察同一原则，可以使用[本机循环实验]({{ '/playground/agent-runtime/' | relative_url }})；
它也明确是脚本提议，不是模型。之后读[怎样验收自己的Agent](../agent-testing-contracts/)。

## 最后再接自己的真实模型 {#real}

先保留一个离线通过的版本。在自己的本地/服务端配置`OPENAI_MODEL`与
`OPENAI_API_KEY`，核对账户权限、参数支持与费用，再运行原客户端：

```sh
python agent_loop.py \
  '比较目录中两座图书馆的代表点距离，并说明限制' \
  --catalog catalog.json \
  --max-requests 4 --max-dispatches 3
```

真实模式会把问题、工具定义和必要工具结果发送给配置服务。Key不进入
网页、README、URL或公开仓库；`store=False`不是服务绝不保存资料的承诺。
返回的文本/观察也可能带入你提供的内容，本例不是通用脱敏与安全存储器。

只支持三个直接、同步只读工具。没有MCP适配、namespace、异步工具、
写操作、通用认证、远程追踪或总任务截止管理。传输timeout、请求预算、
派发预算、token与费用需要分别理解，不能互相替代。

## 版本与真实来源 {#sources}

2026-11-14核对本项目打包源、真实解压CLI与契约检查。原创脚本不是API
录制，没有运行真实模型或认证MCP兼容性。

- [请求契约与固定SDK来源](../model-request-contracts/#sources)：实际接口固定`openai/openai-python@59738a289ee82c7b86bf1e10230cceb6daa9716d`，版本3.50.0。包内保留Apache-2.0全文，没有转存SDK。
- [循环与上下文的固定来源](../agent-loop-basics/#sources)：控制流、直接函数回执与独立预算的方法；原实现和中文组织为本项目原创。
- [httpx2固定MockTransport源码](https://github.com/pydantic/httpx2/blob/6bfbf296bd87891287b3b0335493c7317be4ef18/src/httpx2/httpx2/_transports/mock.py)：实际核对同步handler直接在内存返回响应；2.16.0，BSD-3-Clause全文随包保留，没有复制其实现。
- [OpenStreetMap归属与ODbL](https://www.openstreetmap.org/copyright)：六点目录仍沿用来源核对日2026-11-02，完整point来源在包内保留，没有新核实地点或道路。

未来升级SDK、模型或资料时重跑相应检查，不把本次固定版本说成永远最新。
