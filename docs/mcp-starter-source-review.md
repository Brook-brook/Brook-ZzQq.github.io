# MCP本机项目：固定来源与实际核对范围

2026-11-14，实际读取官方Python SDK2.3.0发布信息及提交
`2118f14f8a19bc158d8a1cf90af58d85d187f849`。与上一篇协议规范笔记的
固定仓库、版本和许可分别记录，没有假定二者同为一份MIT。

阅读README及pyproject、完整协议版本/低层Server说明，客户端、stdio、
工具、结构化输出、错误文档的相关范围，完整SDK MIT许可。
原文位置：[固定树](https://github.com/modelcontextprotocol/python-sdk/tree/2118f14f8a19bc158d8a1cf90af58d85d187f849)。
不是对整个仓库/所有文档或任意宿主的全面认证。

实际运行确认了SDKv2低层构造回调、auto的server/discover结果、服务自报
信息、tools能力与三个契约。显式legacy在同一SDK/服务下得到2025-11-25，
无discovery；不是给旧initialize示例换一个新版标签。

低层服务公布input_schema不自动校验，故原创代码先做原工具契约验证。
Unicode码点和UTF16单位限制不同，40/41个非BMP字符边界独立测试。
SDK客户端拒绝缺字段的structured output，但不能识别形状正确的999距离。
文本/结构一致由原创客户端另查；事实通过独立acos参考验证。
错误提供修正机会，不保证任何未运行的模型会自我修正。

原代码/教程使用MIT，完整SDK MIT与httpx2 BSD3随包，不复制SDK实现或
转存distribution。纯函数从既有原创agent_loop.py有界提取，清单保留源SHA
与转换类型；没有第二份手写数学算法。六个既有WGS84代表点、每条来源、
2026-11-02核对日和OSM/ODbL保持。数值容差不是校园资料精度。

实际Python3.12、mcp2.3.0、mcp-types2.3.0、httpx2 2.16.0环境，未安装
OpenAI SDK。六项包内测试和四项真实解压/CLI检查通过，含stdio两种模式。
标准库隔离检查额外从真实ZIP运行纯工具，不冒充协议SDK测试。
没有模型、远端HTTP、账号认证、私有文件或其他宿主兼容性测试。
