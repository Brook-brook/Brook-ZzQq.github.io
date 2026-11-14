# Brook 的最小 Agent 搭建练习

Python 3.11+。这份原创练习复用网站的受限只读客户端，以真实SDK接收**脚本编写的内存假HTTP响应**。
没有模型推理、MCP服务、真实API回包或模型成绩。先把确定程序跑对，再决定是否接入真实模型。

## 1. 先准备环境

把ZIP解压，终端进入包含本文件的 `brooks-agent-starter` 目录。
Mac/Linux示例：

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python demo_offline.py
python run_checks.py
```

Windows可用 `py -m venv .venv`，再在PowerShell运行 `.venv\Scripts\Activate.ps1`；
激活受策略限制时，可直接用 `.venv\Scripts\python.exe` 替代命令中的python。
安装依赖需要获准的包索引或本地缓存；安装完成后的离线demo不需要API Key或网络。
直接依赖固定为 `openai==3.50.0` 与 `httpx2==2.16.0`，不是声称永远最新。httpx2的这次固定版本要求Python3.11+；实际解压验证使用Python3.12。不要先升级后把旧测试结果照搬过去。

GitHub Pages和HTTP预览只提供文件，不执行Python。Pyodide网页练习也不是此SDK项目的运行环境。

## 2. 先找文件的职责

```text
agent_loop.py       已有实际客户端：校验、三个只读工具、循环、预算与回执
catalog.json        六个公开代表点及原来源；不是完整校园数据
demo_offline.py     脚本假响应接入真实SDK，明确没有模型
run_checks.py       六项契约检查；不是模型评测或学习评分
requirements.txt    经核对的SDK版本
NOTICE.md           来源日期、数据许可、模型/模拟边界
MANIFEST.json       每个包内源文件的SHA256；不是发布者签名或安全认证
```

`agent_loop.py`打包时取网站公开例子的同一源文件，没有另写第四份距离算法。
ZIP还包含原创代码MIT、SDK的Apache2与httpx2的BSD3实际许可文本；没有转存第三方库。

## 3. 看默认输出中的三个位置

`python demo_offline.py`默认使用distance情景。完整JSON中应看到：

- 顶层 `model_called: false` 和 `http_transport: "in-memory MockTransport"`。
- `report.status: "answered"`、两次SDK请求、一次实际工具派发。
- `report.observations[0].output.result.distance_m` 约1020.225507m。

回答文字是固定假回包；数值由真正的Python球面函数算出。`answered`只表示收到文本，
`answer_fact_checked`仍为false。公式计算的0.001m检查容差不是校园坐标或现实导航精度。

## 4. 每次只改一个条件

```sh
python demo_offline.py --scenario batch --max-dispatches 1
python demo_offline.py --scenario forbidden
python demo_offline.py --scenario wrong-type
python demo_offline.py --scenario empty
python demo_offline.py --scenario repeating --max-requests 2
```

| 情景 | 应观察到什么 |
| --- | --- |
| batch / 派发上限1 | 一次提议含两个调用；只发生第一次，保留一条观察，budget_exhausted，没有最终回答 |
| forbidden | 未开放发布工具在派发前失败，实际工具次数为0 |
| wrong-type | 字符串半径被拒绝，不替它补成数字 |
| empty | 目录内食堂匹配为0；answered仍不证明现实中没有食堂 |
| repeating / 请求上限2 | 两次新ID重复同一工作，到请求预算停止，不能补成成功 |

这些错误/预算情景返回退出码1是**预期结果**。把命令用 `&&` 串起来会在这里停止；
逐条运行、看JSON中的明确状态。命令参数本身非法时，argparse返回2。
`python run_checks.py`是另一回事：所有既定断言满足时退出0，失败退出非零。

## 5. 为什么说是离线，而不是“假装离线”

客户端用显式占位Key、保留域名 `offline.invalid`、`httpx2.MockTransport(handle)`，
并关闭环境代理读取。MockTransport直接在内存调用handle，不建立socket；没有网络回退。
脚本情景只返回预写的类型化响应，再让原客户端决定是否派发。它们不依据你的自然语言推理。
检查程序另外禁止socket连接，避免把意外请求当成通过。不要把占位Key替换成真实Key。

## 6. 怎样接上自己的有权模型

先保持离线检查通过。单独运行原始 `agent_loop.py`，在自己的本地/服务端配置
`OPENAI_MODEL`和`OPENAI_API_KEY`，模型须支持所用Responses参数、直接同步函数调用
及必要上下文；先核对实际账户权限、费用和数据政策。此包没有验证真实模型支持。

```sh
# 在自己的环境里配置上述变量；不要把真实值放进此文件、网页或公开仓库。
python agent_loop.py \
  '比较目录中两座图书馆的代表点距离，并说明限制' \
  --catalog catalog.json \
  --max-requests 4 --max-dispatches 3
```

真实模式会向配置服务发送问题、工具定义和必要工具结果；只使用获准公开材料。
`store=False`不是“服务永不保存数据”的承诺。模型文字仍未自动核实；预算上限分别限制
请求/派发，不是费用、token或全应用截止时间。传输timeout也不是全任务绝对截止。
不支持任意URL、shell、写工具、namespace、异步工具、授权流程或MCP协议。

## 7. 留下一份可核对的结果

可以显式重定向公开离线结果，如 `python demo_offline.py > demo-result.json`。
默认不创建追踪服务、学习记录或隐藏结果文件。运行真实模式时，即使报告不含原问题，
返回的回答、参数和工具观察仍可能含你输入的内容；本例不提供通用脱敏或安全存储。

先写一个简单直接函数基线、正常例、缺资料例、拒绝例，再保留未用于调试的新题。
六项离线契约检查只验证这组脚本/程序行为；真实模型任务成功、费用、延迟、泛化
和安全仍要另外验收。更多读法见Brook知识库的Agent搭建手册与测试笔记。
