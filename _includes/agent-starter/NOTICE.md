# 来源与范围

原创AI辅助教程/例子，2026-11-14，公开作者Brook。原创代码与说明使用随附MIT许可。
agent_loop.py与网站公开下载复用同一源文件，没有维护另一份工具实现。

catalog.json是既有六点WGS84代表点公开快照，来源核对日2026-11-02，
不是新核实坐标、道路网络、建筑入口或开放信息。完整来源在每条point的
source/osm与顶层attribution/note中保留。OSM contributors / ODbL-1.0：
https://www.openstreetmap.org/copyright
https://opendatacommons.org/licenses/odbl/1-0/

球面计算半径6371008.8m，数值容差不是现实定位/导航精度。目录空匹配
不能证明现实中不存在；本包不收集或包含私人手记。

直接依赖openai==3.50.0与httpx2==2.16.0另从包索引安装，没有在ZIP中转存该SDK或httpx2。
SDK接口按公开固定提交59738a289ee82c7b86bf1e10230cceb6daa9716d核对，
Apache-2.0完整许可随附OpenAI-Python-LICENSE.txt。依赖自身的完整许可
与传递依赖请以安装的distribution为准，不将它们改称本项目原创。
https://github.com/openai/openai-python/tree/59738a289ee82c7b86bf1e10230cceb6daa9716d

离线demo使用真实SDK配原创内存假HTTP回包：不是模型生成、真实API记录、
MCP服务或智能体能力基准。安装依赖需要包索引/获准的本地缓存；安装后
执行离线演练无需API Key或网络，没有真实模型调用费用。

httpx2实际安装版本2.16.0，固定来源6bfbf296bd87891287b3b0335493c7317be4ef18。
实际核对MockTransport源码与BSD-3-Clause全文，随附httpx2-LICENSE.md。
https://github.com/pydantic/httpx2/tree/6bfbf296bd87891287b3b0335493c7317be4ef18
