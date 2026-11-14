# 第二十五轮：从接口概念到真实本机MCP

基于已推送、未合并的第二十四轮`c5e52c9`，开发分支
`feat/atlas-iteration-25`。原函数客户端与网页实验保留；新增原创MCP
教程和可解压运行项目，不把普通JSON函数调用改个名字当协议实现。

## 可以实际做什么

在`/knowledge/agent-mcp-server/`下载`brook-mcp-starter.zip`。约19KiB，
十三条精确内容含原创源码/说明、公共目录、完整许可与MANIFEST。Python
3.11+，按包内要求安装mcp2.3.0/httpx2 2.16.0，运行`client_check.py`。
客户端实际启动本机stdio子进程、发现三个工具、检查能力并并发读取结果。
不运行模型、不需要Key、不公开HTTP端口；安装依赖可能需要包索引。

实际默认auto协商2026-07-28并收到discovery，显式legacy得到2025-11-25
且没有discovery。版本字段和服务端自报名不是身份认证，也不证明任意
宿主兼容。两个模式均在同一固定SDK/教学服务上实测。

低层Server通过构造回调公布契约，但不自动验证参数。实现先执行精确
白名单/类型/已有ID/有限值检查，再派发。六项检查验证非法调用零派发、
UTF16与码点边界、实际数值/空匹配、两种stdio模式；注入的坏形状回执
被SDK拒绝，正确形状的999距离仍能通过schema，需额外事实参考。

纯工具通过受控AST提取来自已有原创`agent_loop.py`，不重复数学算法，
也不要求MCP服务导入模型SDK。生成清单保留原源SHA与转换标记。原Agent
项目默认打包、哈希和四项检查仍通过。SDK内存层与真实stdio层分开核验。

## 学习与页面

AI入口连接新教程，Knowledge增加三条有说明的阅读联系。搭建路线追加
两道永久题目，十一条路线三十四题；公开笔记二十一、联系二十九、搜索
元数据六十。旧三十二ID、同一v1 key/schema保留，没有自动记录访问、
下载、掌握或完成。新题与原网页工具实验相连时明确“非MCP协议页”。

沿用原生阅读、目录、代码滚动和早期下载入口。实际截图发现初稿长标题
把“通过”拆开，缩为“把只读工具接上MCP”后重新检查。390/768/1440双
主题、320px、无JS、键盘、真实ZIP/哈希、中文搜索、正文实际16→32px
均通过；不是完整浏览器缩放或实体机结论。

固定Hallmark三URL/15截图最终0 FAIL/REFLEX/WARN；独立新上下文finish
review为ship、零发现，还实际下载19076bytes并核对SHA、代码右滚和
页面存储访问。截图前后与记录见[审计](design-audit-iteration-25.md)。

## 验证

| 检查 | 实际结果 |
| --- | --- |
| `npm run build`、`npm test` | 通过 |
| `npm run test:atlas` | 132项通过，含标准库实际ZIP纯工具与旧包新鲜度 |
| 容器`bash tools/test.sh` | 43案例/238断言；66 HTML/436内链通过 |
| 根路径、项目路径构建/HTMLProofer/artifact guard | 通过，标题修正后再次构建与产物检查 |
| `npm run test:ai:mcp`（实际MCP-only环境） | 四项解压/CLI检查与六项包内检查通过，未装模型SDK |
| 新MCP浏览器 | 根/子路径、六组尺寸/主题、axe/无JS/真实下载/键盘/大字/旧32手记通过 |
| 真实Pyodide | 三例、空均值错误、异常、输出上限、超时、重载和停止通过 |
| 整站25浏览器套件 | 单次完整命令从头到尾全部通过，退出码0，原始日志保留 |

旧32夹具在paths/practice打开与导出保持精确原始值，明确填写/勾选才新增
第33条。公开文章/搜索只做本站GET，不访问两份私人存储或上传夹具。
Safari/Firefox、实体手机、OS输入法、完整浏览器缩放、LLM/远端认证和
其他宿主未验证。没有修改Pages/生产工作流、合并或部署。

## 文件与预览

主要文件：`_atlas_notes/agent-mcp-server.md`、`_includes/mcp-starter/`、
两份公开ZIP清单、显式打包输入/受控纯函数生成器、SDK/CLI/browser检查，
以及既有AI入口、路线/问题/联系和首页记录。原有公开数据核对日仍为
2026-11-02，完整SDK MIT/HTTPX BSD3/原创MIT/OSM ODbL归属保留。
[来源范围](mcp-starter-source-review.md)、[compliance](iteration-25-compliance.md)。

证据：[构建](iteration-25/build-results.txt)、[浏览器](iteration-25/browser-results.txt)、
[实际包](iteration-25/archive-results.txt)、[Hallmark](iteration-25/hallmark-results.txt)、
[独立复核](iteration-25/finish-review.txt)。截图：[初稿标题](iteration-25/screenshots/initial-title-1440.png)、
[最终桌面](iteration-25/screenshots/mcp-1440.png)、[手机](iteration-25/screenshots/mcp-375.png)。

从成功CI下载`atlas-review-preview`，按[预览指南](PREVIEW.md)在包含
`Brook-ZzQq.github.io`那层启动`python3 -m http.server 8000`，打开
`http://127.0.0.1:8000/Brook-ZzQq.github.io/knowledge/agent-mcp-server/`。
网页预览不执行Python。下一步是明确宿主如何连接模型调用信封与MCP，
保留独立预算、调用关联与失败状态，仍不以协议成功替代任务验收。
