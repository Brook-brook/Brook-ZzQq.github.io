---
layout: atlas
title: 把只读工具接上 MCP
date: 2026-11-14
category: Agent Development
kind: tutorial
ai_assisted: true
tags: [MCP, 智能体搭建, Agent搭建, stdio, Tool Calling, client, server, protocol, JSON Schema]
summary: 运行真实本机客户端与服务端，核对发现、输入验证和结构化回执；把协议连接、工具执行与任务正确分开。
download:
  path: /assets/examples/mcp-starter.zip
  filename: brook-mcp-starter.zip
  label: 下载原创 MCP 本机练习包
  detail: Python 3.11+；安装固定依赖后运行，无需模型 Key。
toc:
  - {id: run, label: 先跑通一条消息路径}
  - {id: roles, label: 模型没有出现在这里}
  - {id: discovery, label: 看真实发现而非版本标签}
  - {id: validation, label: Schema公布后仍要查参数}
  - {id: result, label: 读回执的三道检查}
  - {id: limits, label: 权限和任务属于哪一层}
  - {id: sources, label: 固定版本与实测范围}
---

这份原创、AI辅助练习把已有的三个只读GIS函数接成实际MCP服务。先运行
下载包，再沿消息路径拆解。没有模型、MCP远程地址或浏览器Key输入；
网页只提供材料，服务由你在本机显式启动。

## 先跑通一条消息路径 {#run}

解压进入`brooks-mcp-starter`目录，用Python3.11+运行以下Mac/Linux命令。
直接依赖固定为`mcp==2.3.0`、`httpx2==2.16.0`，本轮实际Python3.12验证。

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python client_check.py
python run_checks.py
```

安装依赖需要包索引或缓存。安装后的本机stdio流程无需远端服务或模型
账号，也不需要OpenAI SDK。客户端会自己启动/关闭服务子进程；不用先
另开一个服务窗口。单独运行`server.py`会等待MCP输入，不是HTTP网页。

默认JSON会显示实际协商版本、是否收到discovery、服务端自报信息、三个
工具的正常/拒绝结果与来源日期。[查看文件与ZIP哈希]({{ '/assets/examples/mcp-starter.manifest.json' | relative_url }})。
清单帮助检查内容一致，不是作者签名、授权或安全认证。

## 模型并没有出现在这条路径里 {#roles}

```text
你的检查脚本 → MCP Client → stdin/stdout → MCP Server
                                            ↓
                                已校验的三个只读GIS函数
```

| 角色 | 本包中实际做什么 |
| --- | --- |
| 宿主的一部分 | `client_check.py`明确选择测试调用；没有聊天产品或模型决策 |
| MCP客户端 | SDK负责发现、协议请求与关联、结果解析；不替你判断任务 |
| MCP服务端 | 公布三个工具/契约，验证参数后分发；只注册tools |
| 工具实现 | 真正查固定公开目录、算球面距离或半径结果 |
| 模型 | 没有参与；`model_called:false`不是一次模型的评分 |

stdio把JSON-RPC送入本机进程的标准输入/输出，不是把参数拼成shell命令。
服务端stdout只给协议使用，调试信息要去stderr。这个进程仍有正常操作系统
能力；只读注解不是沙箱。实际接口只开放已实现的三个固定读操作。

## 不要只看一个版本字符串 {#discovery}

默认`Client(..., mode="auto")`在这个SDK下先做`server/discover`。本轮真实
stdio结果是`2026-07-28`，并实际拿到了discovery结果和服务端名称/版本。
这里只验证本包、这版SDK及这组调用，不推断所有宿主都已支持。

硬把`mode`设成版本字符串，SDK可以不发送发现就采用它；因此只打印版本
不是实际发现的证据。服务端自报名称也不等于身份认证。本包检查两者的
实际来源，而不自己填一串“已连接”。

另外可以显式试一次旧模式：

```sh
python client_check.py --mode legacy
```

同一服务/SDK实际走旧握手，得到`2025-11-25`且没有discovery结果。这不是
远端旧服务器兼容性认证，也不能把旧`initialize`示例改个标签当成新版协议。

## 公布Schema之后，还要真实校验 {#validation}

本例用SDKv2低层`Server`，为保留现有JSON字段与精确契约；高层`MCPServer`
也可从类型生成schema，不是所有人都需要写低层服务。

```python
server = Server(
    "Brook public campus read tools",
    on_list_tools=list_tools,
    on_call_tool=call_tool,
    get_tool_input_schema=input_schema,
)
```

这是固定SDK2.3.0的构造回调接口。不要直接混用其他版本低层服务的装饰器。
低层`Server`**公布input_schema但不会自动把它用于参数验证**。本实现收到
调用后先查白名单，再用原`checked_call`检查精确字段、数值/字符串、有限值
和已有ID，之后才派发；未开放工具、额外字段和字符串半径都零执行。

还有一个具体细节：JSON Schema的`maxLength`按Unicode码点计，原工具后端
用UTF16单位限制80。40个非BMP地球emoji是80单位，41个是82单位。这个
限制在schema说明和测试里写明，不能因为“schema通过”就省掉后端检查。

三个函数从原有原创客户端的明确纯函数生成，包内不导入模型SDK。目录、
算法与来源没有再写一套；生成源SHA与转换关系保留在清单。不会因协议
接通就新增道路、时刻表或私人数据。

## 回来一份结果，仍有三道检查 {#result}

先看`is_error`。本例输入不符或未开放工具会明确返回工具错误；低层未处理
异常属于协议错误，不能都捕获后填成成功。

然后读`structured_content`和`output_schema`。服务端构造`content`文字与
`structuredContent`结构化值；Python客户端使用snake_case属性访问。本包
另外检查JSON文字与结构化值一致，协议并不自动让任意文字都忠于数据。

最后核对任务事实。检查程序会明确注入两种坏回执：缺字段被SDK客户端
按输出schema拒绝；形状正确却把距离写成999的回执仍能过schema，必须再
用独立数值参考发现。注入只在测试中，不在正常服务开启，也不是模型输出。

两点代表点距离约1020.225507m，同ID为0；目录里食堂匹配0不表示现实没有
食堂。来源核对日仍是2026-11-02。数值容差、球面模型、地点资料和步行导航
的精度是不同问题。

## 权限、预算和最终解释在别的层 {#limits}

readOnlyHint等注解是提示，服务端与宿主仍须有真实允许规则。工具输出和
`_meta`都不能授予新权限，元数据也不是秘密保险箱；宿主决定怎样呈现和
转发。schema、发现成功和`is_error:false`分别提供有限信息，不认证任务正确。

这个服务不决定Agent下一步、不限制模型费用，也不提供远端HTTP认证、
写工具或通用隔离。原[直接函数项目](../agent-project-starter/)仍是另一条
路径；它不会因为这个新包存在就自动变成MCP客户端。模型的工具调用信封
也不能直接冒充MCP消息，宿主适配与回执关联还要另外实现。

想先免安装练参数，可去[本地工具实验]({{ '/playground/tool-calling/' | relative_url }})。
它仍是原生JS函数与脚本提议，不走MCP；本节的协议验证来自实际Python包。

## 固定版本与实际验证范围 {#sources}

2026-11-14对照MCP Python SDK2.3.0固定
`2118f14f8a19bc158d8a1cf90af58d85d187f849`的相关部分，原创例子未复制SDK实现：

- [Client与结果](https://github.com/modelcontextprotocol/python-sdk/blob/2118f14f8a19bc158d8a1cf90af58d85d187f849/docs/client/index.md)、[stdio传输](https://github.com/modelcontextprotocol/python-sdk/blob/2118f14f8a19bc158d8a1cf90af58d85d187f849/docs/client/transports.md)。
- [协议版本](https://github.com/modelcontextprotocol/python-sdk/blob/2118f14f8a19bc158d8a1cf90af58d85d187f849/docs/protocol-versions.md)、[低层Server](https://github.com/modelcontextprotocol/python-sdk/blob/2118f14f8a19bc158d8a1cf90af58d85d187f849/docs/advanced/low-level-server.md)：构造回调、主动验证、结果与元数据边界。
- [结构化输出](https://github.com/modelcontextprotocol/python-sdk/blob/2118f14f8a19bc158d8a1cf90af58d85d187f849/docs/servers/structured-output.md)、[错误](https://github.com/modelcontextprotocol/python-sdk/blob/2118f14f8a19bc158d8a1cf90af58d85d187f849/docs/servers/handling-errors.md)。可读错误提供修正机会，不保证模型真的修正。
- [实际SDK MIT许可](https://github.com/modelcontextprotocol/python-sdk/blob/2118f14f8a19bc158d8a1cf90af58d85d187f849/LICENSE)：全文随包，与协议规范仓库的复合许可分开。httpx2 BSD3与原目录OSM/ODbL亦保留。

已验证SDK内存层、真实stdio子进程、两种明确模式和本组确定工具；没有
运行LLM、远端服务认证、其他宿主或生产部署。固定版本不是永远最新承诺。
