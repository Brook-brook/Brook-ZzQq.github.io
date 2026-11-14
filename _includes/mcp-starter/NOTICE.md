# 来源与许可

原创AI辅助的Brook本机MCP教学例子，2026-11-14。原创代码/说明按随附MIT许可，
Copyright2026 Brook。协议服务/客户端脚本独立编写，没有复制SDK或教程实现。

官方MCP Python SDK2.3.0固定：2118f14f8a19bc158d8a1cf90af58d85d187f849。
实际阅读README、客户端/stdio、协议版本、低层Server、工具、结构化输出、错误说明及完整MIT许可。
https://github.com/modelcontextprotocol/python-sdk/tree/2118f14f8a19bc158d8a1cf90af58d85d187f849
完整MCP-Python-SDK-LICENSE.txt保留Copyright2024 Anthropic,PBC。SDK distribution不在包内，需另安装。
这份SDK的MIT许可与协议规范仓库的复合许可不是同一个东西。

httpx2 2.16.0固定6bfbf296bd87891287b3b0335493c7317be4ef18，BSD3，完整文本随包。
此固定组合要求Python3.11+，实际3.12测试；其他传递依赖按安装的distribution保留归属。
没有转存第三方库、字体、图标或图片。

campus_tools.py由打包器从既有原创assets/examples/agent_loop.py的明确纯函数生成，
源SHA与转换标记在MANIFEST中保留，没有另写一套数学算法，也无需导入模型SDK。
数据仍为原六点WGS84代表点及每条Mapcarta/OSM来源，核对日2026-11-02。
OpenStreetMap contributors / ODbL-1.0：
https://www.openstreetmap.org/copyright
https://opendatacommons.org/licenses/odbl/1-0/

未新增或重新核实坐标，不提供步行路线/入口精度。球面半径6371008.8m；数值容差不是资料精度。
实际测试包括SDK内存层和真实stdio子进程两种层次，没有真实模型、远程HTTP认证或其他宿主互通测试。
所有运行时结果为本组确定只读函数与明确测试输入；不包含任何真实用户资料或学习手记。
