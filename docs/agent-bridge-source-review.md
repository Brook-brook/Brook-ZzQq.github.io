# Agent与MCP宿主适配：来源与核对

2026-11-14。复用前两包已固定的公开接口，另实际读取OpenAI Python
`59738a289ee82c7b86bf1e10230cceb6daa9716d` README的Async usage与相邻
传输部分、安装SDK的AsyncOpenAI构造与Responses接口、httpx2的异步
MockTransport handler。使用已有完整Apache2/BSD3归属，不复制SDK实现。
MCP Python SDK2.3.0与协议/stdio/低层校验范围沿用前篇完整来源记录。

原创宿主把可信固定契约转换成provider工具定义，保留两套关联空间，
不转发任意服务描述作为允许指令。整批参数校验、独立尝试预算、必要
上下文、回执与取消由原创程序负责；不把SDK连通外推成任务正确。

控制提取保留已有原创campus_tools的七个函数/两个常量，以及原演练脚本
三个fixture函数/一个常量，清单记录原源SHA、转换类型与生成SHA。MCP
服务与公开目录直接复用。没有另一套数学算法、付费模型、远端端点或
上游第三方代码；完整实际MIT/Apache2/BSD3和OSM/ODbL资料仍随包。

真实Python3.12运行四项解压/CLI检查与包内十二项SDK检查；stdio正常路径
与内存层故障注入分别标明。直接依赖openai3.50.0/mcp2.3.0/httpx2 2.16.0。
另将同一公开ZIP安装在固定python:3.11-slim基础镜像
`sha256:07d4824036af339fa1b6ef769cc99d9c10a141769538b52b3b597c84f7a7b535`，
实际3.11.18，以UID10001、network none、只读rootfs/tmpfs运行十二项全部
通过。公开ZIP SHA为ad09a3055e8ee64fbd72413cb4679566a9ccb8bf209d066033398953e186863f。
身份哈希单独用只读root权限读取原root-owned ZIP，不改变程序检查用户。

首次容器安装因会话代理CA不在基础镜像而失败；按环境指引用BuildKit
secret挂载现有CA、保持HTTPS校验后通过，没有关闭TLS、改网络政策或把
CA写进镜像。临时测试镜像/配置在ignored work，未提交或部署。

这证明固定环境/输入的程序行为，不是通用模型抗注入、现实事实核实、
任意宿主兼容、OS安全认证或服务内部执行证明。所有提问/注入是合成
夹具，目录日期仍2026-11-02，没有读取私人学习资料或真实账号。
