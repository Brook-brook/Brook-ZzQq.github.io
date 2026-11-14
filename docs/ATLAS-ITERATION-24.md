# 第二十四轮：把散页知识搭成可运行的小项目

基于已推送、未合并的第二十三轮`7a30e0e`，开发分支
`feat/atlas-iteration-24`。本轮继续Agent搭建知识库：保留原理课与实验，
增加能下载、解压、运行、修改和核查的项目材料。

## 可以直接动手的内容

新增两篇原创AI辅助笔记：

- `/knowledge/agent-project-starter/`：文件职责、环境、第一次运行、读取
  观察、逐项改变参数，以及何时再接自己的真实模型。
- `/knowledge/agent-testing-contracts/`：区分程序契约、工具数值、任务
  验收和真实模型评测；读六项断言，先制造一个可解释的失败再恢复。

约22KiB的`agent-starter.zip`含真实源码、公开目录、README、依赖、许可
与哈希清单。打包直接取已有`agent_loop.py`，没有再维护一套距离算法。
运行条件为Python3.11+及固定openai3.50.0/httpx2 2.16.0，实际用3.12验证。
安装需要包索引或缓存，安装后的离线演练无需Key或网络。

真实SDK接收脚本预写的内存假HTTP，工具函数真实执行。默认距离、一次
提议的批量调用、未开放工具、错误类型、目录空匹配和重复都可操作；
批量中途到限额保留已经发生的工作，不补造后续结果。假回包不是模型
推理，`answered`与`answer_fact_checked:false`一起保留。

六项契约检查额外拦截socket连接。测试包本身还从真实ZIP解压，核对CLI
退出码、公共来源和非法预算。真实模型支持、费用、延迟与任务效果仍
未运行，不能把这些fixture写成模型成绩。

AI入口增加原生“搭一个小项目”跳转和手册/包/问题链接。新搭建路线
追加四个永久问题ID，共十一条路线、三十二题；旧二十八ID、同一v1
手记与原始raw导出保留。阅读、下载和运行不会自动记完成。
当前二十公开笔记、二十六条编排联系、五十九项公开搜索元数据。

## 根据真实页面做的修正

初版下载在正文大表格后，手机要翻到第三屏。现在它在文章简介下、目录
之前，附真实Python版本与离线条件；390×844下动作与说明在约521–615px。
无材料的文章没有空按钮。字段只允许实际发布的公开examples ZIP，文件名
和文字受限并转义；存在但被排除的文件同样在构建前拒绝。

依赖实际metadata指出httpx2 2.16.0要求Python3.11，已统一修正新项目，
没有沿用原单文件客户端的较低语法最低版本。长命令改成合法shell续行，
解决Hallmark指出的桌面代码边缘拥挤；保留完整参数和键盘滚动。

大字号补查会验证正文自身16→32px、下载文字16→32px，320/390下都仍
完整换行、可操作，无页面横向溢出。只改html根字号会漏掉继承自固定body
的文本，所以测试另断言真实计算字号。这不是完整浏览器缩放或实体机验证。

三条真实URL、两个CSS文件、十五幅规定截图，最终Hallmark为
0 FAIL / 0 REFLEX / 0 WARN。按gates§6完成独立新上下文finish review，
结论ship、零问题；真实ZIP/哈希、无JS、焦点、四个代码滚动区和原入口
保留均核对。完整过程见[设计审计](design-audit-iteration-24.md)。

## 实际结果

| 检查 | 结果 |
| --- | --- |
| `npm run build`、`npm test` | 通过 |
| `npm run test:atlas` | 130项通过，包含四项真实包/源码/路径新鲜度检查 |
| 容器`bash tools/test.sh` | 43案例 / 238断言；65 HTML / 422内链通过 |
| 根路径构建、HTMLProofer、artifact guard | 通过；新包/文章/旧28记录浏览器也在根路径通过 |
| `python3 tools/build-agent-starter.py --check` | 十一条精确有界ZIP内容与当前源/manifest一致 |
| 实际SDK、真实解压项目 | 四项仓库检查和包内六项契约检查通过；另从实际ZIP要求安装干净venv，pip check通过，无真实模型 |
| 新项目浏览器 | 390/768/1440×双主题、原生下载/哈希、中文检索、键盘、无JS、旧28raw与显式扩展通过 |
| 整站浏览器 | 24套件按记录恢复运行后全部完成；真实Pyodide三例/异常/输出上限/超时/重载/停止通过 |

回归先发现旧测试仍假定十条路线和Python只匹配两条路径。新增搭建路线
确实使用Python，现保留明确的三条搜索结果断言。当前路线/题目总数另从
公开YAML独立读取，历史备份ID夹具仍固定；没有删断言或改学习存储代码。
本机恢复日志保留失败及已通过的套件，PR CI会从头跑完整流程。

Safari、Firefox、实体手机、OS输入法、完整浏览器缩放与真实模型未验证。
没有部署网站、修改Pages/生产工作流、自动合并，或读取真实用户手记。

## 文件、来源与预览

主要文件：两篇新笔记、`_includes/agent-starter/`项目材料、原生
`note-download.html`及实际发布校验、学习路线/参考/联系/公开检索，
`tools/build-agent-starter.py`与Node哈希守卫，以及解压/CLI/浏览器测试。

新直接示例依赖httpx2 2.16.0固定`6bfbf296`，实际阅读MockTransport源码与
BSD3全文，完整许可随站点与ZIP保留。原SDK Apache2、原创MIT、既有
六点OSM/ODbL来源均保留，没有转存第三方distribution或新坐标。
[来源审查](agent-starter-source-review.md)、
[compliance](iteration-24-compliance.md)。

截图：[旧AI入口](iteration-24/screenshots/before-ai-390.png)、
[初版下载位置](iteration-24/screenshots/initial-guide-390.png)、
[修正首屏](iteration-24/screenshots/download-fold-390.png)、
[最终桌面](iteration-24/screenshots/guide-1440.png)。
日志：[构建](iteration-24/build-results.txt)、
[浏览器](iteration-24/browser-results.txt)、
[实际ZIP与CLI](iteration-24/archive-results.txt)、
[Hallmark](iteration-24/hallmark-results.txt)、
[独立审查](iteration-24/finish-review.txt)。

从最新成功CI下载`atlas-review-preview`，按[PREVIEW.md](PREVIEW.md)在包含
项目文件夹的那层启动`python3 -m http.server 8000`，打开：

```text
http://127.0.0.1:8000/Brook-ZzQq.github.io/study/ai/
http://127.0.0.1:8000/Brook-ZzQq.github.io/knowledge/agent-project-starter/
```

网页编译预览、仓库源码ZIP、文章内Python练习包各有不同用途。下一步
是把同一公开只读工具通过真实本机MCP提供出去，再解释宿主/协议/模型
适配的边界；不以协议连接成功代替任务验收。
