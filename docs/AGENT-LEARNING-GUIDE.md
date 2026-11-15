# 从能运行，到能解释：Agent搭建导览

这些材料位于开发分支；预览按[PREVIEW.md](PREVIEW.md)获取编译产物。
本地网站入口为`/Brook-ZzQq.github.io/study/ai/`。没有先修锁，学习记录
只在你明确填写/勾选后保存在自己的浏览器。

| 想弄清什么 | 从哪里开始 | 实际运行边界 |
| --- | --- | --- |
| 值、函数、列表与异常 | [Python基础](../_atlas_notes/python-first-steps.md)及Python Playground | 真实浏览器Python，首次需显式下载运行时 |
| 文本如何变成允许的输入 | [JSON与应用契约](../_atlas_notes/python-json-contracts.md) | 网页/本机共享原创核心；四个例子真实执行，不调用模型 |
| HTTP成功之后，还要查什么 | [一次HTTP的层次](../_atlas_notes/http-response-boundaries.md) | 标准库实际loopback GET、限流/重定向/断开/阻塞超时；没有公网测量 |
| 没收到回执，能直接重做吗 | [未知结果与重试](../_atlas_notes/agent-delivery-boundaries.md) | 网页实际JS内存；下载包另跑真实POST/查询，幂等与历史回执有明确边界 |
| async/await与取消 | [等待与取消](../_atlas_notes/python-async-boundaries.md) | 网页/本机共享标准库函数，没有模型或MCP |
| 进程退出后还能核对什么 | [SQLite提交与恢复](../_atlas_notes/agent-state-recovery.md) | 真实临时文件/子进程退出与重开；不是网页执行、完整Agent或跨服务事务 |
| 一个项目里各文件的职责 | [搭建手册](../_atlas_notes/agent-project-starter.md) | 真SDK+原创内存假响应，直接执行三个真实读函数 |
| 协议怎样发现/调用工具 | [MCP服务](../_atlas_notes/agent-mcp-server.md) | 本机stdio、真实发现/服务，没有模型 |
| 谁连起调用提议和协议 | [宿主桥接](../_atlas_notes/agent-mcp-bridge.md) | 真异步SDK+假provider、真stdio，预算/回执/部分工作可查 |
| 程序通过还差哪一层 | [检查与验收](../_atlas_notes/agent-testing-contracts.md)、[任务评估](../_atlas_notes/agent-evaluation.md) | 契约、数值、来源、任务结果分别验收，不是模型分数 |
| 三种接口返回同一距离，证明了什么 | [同一距离，三层证据](../_atlas_notes/agent-interface-evidence.md) | 实际重放三个CLI，选择同一子案例；整段检查计数不可当同一任务步数 |
| Tool、Skill、MCP是否一回事 | [接口边界](../_atlas_notes/skills-mcp-boundaries.md) | 概念/格式材料不被冒充自动加载或通用互通 |

只想先动手，可以从网页JSON例子开始，比较true、1和"1"；已有函数基础
时也可直接运行等待/取消。接口基础补给不是强制先修。要在本机
继续，各包有自己的README和要求；不要把一种运行方式的证明带到另一层。
它们是不同ZIP：

| ZIP | 解压目录 | 第一条运行命令 |
| --- | --- | --- |
| brook-python-async.zip | brooks-python-async | `python3 demo.py`，标准库，无pip |
| brook-api-foundations.zip | brooks-api-foundations | `python3 demo_json.py`，再跑demo_http.py/demo_delivery.py；标准库，无pip |
| brook-agent-restart.zip | brooks-agent-restart | `python3 demo_restart.py`，带sqlite3的标准库，无pip |
| brook-agent-starter.zip | brooks-agent-starter | 安装包内requirements后`python demo_offline.py` |
| brook-mcp-starter.zip | brooks-mcp-starter | 安装包内requirements后`python client_check.py` |
| brook-agent-mcp-bridge.zip | brooks-agent-mcp-bridge | 安装包内requirements后`python demo_bridge.py` |

全部本机包按Python3.11+说明。三个SDK项目的依赖安装可能需要网络，
默认演练无需真实模型Key。每个目录可运行`python run_checks.py`；标准库
项目可用`python3`。批量到上限或非法调用的退出码1是预期失败/停止，
不能为未发生的调用补一份结果。

用新回执实验时，先保持默认，预测第一次发送后客户端与接收端各知道
什么；再选幂等模式，保持key和参数重发，最后改参数/换key/查询旧回执。
手机可用“查看演练透视”和“回到发送区”往返。页面内存不等于真实网络，
同key原子记账也不等于跨服务恰好一次；HTTP包会把这些计数分开输出。

先解释三个反例，再考虑真实接入：schema能过的999距离、空目录不代表
现实不存在、预算耗尽/取消不代表任务完成。浏览器停止Worker也不能
被当作Python finally或外部操作撤销的保证。

各包只含明确公开材料与完整许可/源清单，不含账户或学习手记。哈希
帮助比对材料，不提供身份认证或通用安全保证。真实模型支持、成本、
隐私和任务集需在你自己有权运行的环境另外评估；本站未调用它们。

开发记录：23为文章→问题/接口边界，24为直接函数项目，25为独立MCP，
26为宿主桥接，27为异步基础与Python交互优化，28为同一GIS案例的证据对照，
29为JSON/HTTP/回执及进程恢复基础，两条可选路线追加六题到44。原38项
记录不因访问被重写，只有显式填写/勾选才扩展。
最新分支包含前序代码；
每个PR只展示相对上轮的增量，未自动合并或部署。
