# Brook 的本机 MCP 只读工具练习

原创AI辅助材料，Python3.11+，实际Python3.12验证。使用mcp2.3.0与httpx2 2.16.0。
这次是真的MCP客户端/服务端和stdio消息，不是普通JSON冒充协议；没有模型或远端HTTP服务。

## 安装与运行

解压后进入包含本文件的brooks-mcp-starter目录，Mac/Linux示例：

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python client_check.py
python run_checks.py
```

安装需要获准的包索引或本地缓存。安装后本机stdio流程不需要模型Key或远端服务，
也不需要OpenAI SDK。Windows可直接使用`.venv\Scripts\python.exe`运行同样脚本；
本轮没有验证实体Windows机器。GitHub Pages只供下载，不会启动这项服务。

client_check.py会自己启动server.py子进程并在退出时关闭；不用另开窗口运行服务。
单独运行server.py会等待stdin上的MCP消息，它不是HTTP页面或交互式聊天窗口。
不要在服务端stdout加入调试print，stdout只给协议；诊断输出应到stderr。

## 从结果中找真实边界

默认auto模式先做server/discover；实际结果应为protocol_version2026-07-28、
discovery_received=true，并包含服务端自己声明的名称/版本及三个工具：
find_places、measure_distance、nearby_places。名字不是身份认证，提示也不是权限。

脚本并发核对两点距离、同ID零距离和目录食堂空匹配，再检查字符串半径和未开放工具。
数值来自真正的Python函数，约1020.225507m；0.001m容差不是现实定位/导航精度。
is_error=false只是本次工具结果的状态，不能替代任务与来源检查；本包没让模型回答。

可另外运行：

```sh
python client_check.py --mode legacy
```

同一SDK/服务会显式走旧握手，实际应为2025-11-25且discovery_received=false。
这只验证本包在同一固定SDK下的两种模式，不是所有宿主/旧服务器兼容性认证。
不要把旧initialize示例称作2026-07-28，也不要把硬编码版本pin当作实际发现。

## 每个文件做什么

- server.py：SDKv2低层Server构造回调，仅注册tools；不提供resources/prompts或HTTP监听。
- contracts.py：明确输入/输出schema和公开目录；schema只描述，不自动授予权限。
- campus_tools.py：打包时从现有原创客户端提取的纯只读函数，不导入模型库；不要编辑生成副本。
- catalog.json：原六点WGS84代表点和来源日2026-11-02，不是完整校园或道路网络。
- client_check.py：真实stdio客户端、auto/legacy发现、并发结果关联与独立数值核对。
- run_checks.py：六项程序/协议契约测试，包含明确的坏输出注入；不是模型评测或学习评分。
- MANIFEST.json：明确公共文件/hash与生成源关系；不是签名或作者认证。

## 为什么低层schema仍要自己查参数

此SDK低层Server公布input_schema，却不会自动把它用在params.arguments上。
本实现先检查工具白名单，再用原有checked_call核对精确字段、类型、有限值和已有ID，
才真正派发。未开放工具、额外字段、字符串/布尔半径和未知ID不会进入计算。

query的后端上限是80个UTF16单位，JSON Schema的maxLength计Unicode码点；
含非BMP字符时不是同一计数。schema描述了这一限制，后端仍做最终检查。
readOnlyHint等注解是提示；真实只读性质来自这份实现，进程不是操作系统沙箱。

服务端明确构造content与structuredContent；客户端先查is_error，再读结构化数据。
低层工具拒绝返回is_error=true，意外未处理异常会成为协议错误，不能静默当成功。
测试还故意注入坏形状，确认SDK客户端拒绝；形状正确却写错距离的999仍能通过schema，
说明事实需要独立核查。测试注入不在正常服务中开启，也不是模型生成。

## 没有包含的能力

本包不连接LLM、不执行写工具/任意URL/shell、不读取浏览器手记，不提供远程认证或部署。
HTTP公开、授权策略、限额、真实宿主与模型接入都需要分别设计/核查，不由协议连接替代。
服务端自报元数据不自动可信；_meta也不是存放秘密的地方，宿主决定怎样呈现/转发。

client_check的请求超时/外层等待用于本机检查，不是生产硬实时截止或费用上限。
完整来源与许可见NOTICE.md，原文字/代码MIT，公开数据与依赖各保留自己的许可。
