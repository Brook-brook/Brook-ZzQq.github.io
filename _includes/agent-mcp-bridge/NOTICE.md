# 来源、许可与边界

2026-11-14，原创AI辅助Brook宿主适配、教程、演练/测试与打包材料，MIT /
Copyright2026 Brook，完整原文LICENSE.txt随附。未复制第三方Agent实现。

本包复用前两包原创公共服务、契约、目录和演练fixture；纯工具与fixture
由打包器从明确原文件/函数生成，MANIFEST记录原源SHA/转换及输出SHA。
不重复数学实现，MCP服务无需导入模型SDK。未包含第三方distribution、
venv、缓存、Key、私有文件或浏览器手记。

直接依赖固定版本与实际来源：
- openai3.50.0，59738a289ee82c7b86bf1e10230cceb6daa9716d，Apache2。
- MCP Python SDK2.3.0，2118f14f8a19bc158d8a1cf90af58d85d187f849，MIT，
  Copyright2024 Anthropic,PBC；与协议规范仓库复合许可分别记录。
- httpx2 2.16.0，6bfbf296bd87891287b3b0335493c7317be4ef18，BSD3。
三份完整实际许可随包，各distribution/传递依赖安装时保留自身归属。
固定组合需Python3.11+，实际3.12测试。AsyncOpenAI与MockTransport异步handler
接口实际核对，前两包已记录的README/协议/低层服务范围保持。

公开数据仍为原六点WGS84代表点，每条Mapcarta/OSM来源、2026-11-02日期
与完整归属不变。OpenStreetMap contributors / ODbL-1.0：
https://www.openstreetmap.org/copyright
https://opendatacommons.org/licenses/odbl/1-0/
没有新增/重新核实坐标、建筑、道路或现实开放状态。

实际SDK/本机协议验证不等于模型任务正确；内存provider假回包不是真实
推理，测试的描述注入拦截不构成通用模型安全成绩。未验证真实模型、
远端HTTP认证、其他宿主或生产部署。只读提示/schema/元数据不能授权。
