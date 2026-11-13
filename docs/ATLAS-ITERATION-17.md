# 第十七轮：亲手拆开一次工具调用

基于 GitHub 与本机一致、尚未合并的第十六轮 `4d2dfc1`，新分支
`feat/atlas-iteration-17`。这一轮属于用户要求的持续三小时迭代的第一段，
不把当前阶段完成当作整个时长任务完成。线上设置、生产工作流及观察台
运行/数据分支均未修改。

## 实际功能

新增 `/playground/tool-calling/`：修改 JSON，检查参数，明确执行已有的
本机工具，再交回匹配当前调用的回执，最后查看固定模板怎样使用数值。
实际运行目录文字检索、两点球面距离、半径筛选；程序不是装饰动画。

未知工具、额外字段、错误类型、未知地点、非有限/越界参数均被拒绝。
错误案例会故意错配第一份回执，不能因此继续解释/导出；明确重试可恢复。
改参数立即清除旧校验和结果。导出包含本次参数、实际输出、归属及能复算
三个工具的完整所需目录字段；不读取学习手记或访问外网。

默认两座图书馆的代表点距离为约 1020.2255 米，独立 Python
`atan2(cross,dot)` 公式与浏览器 Haversine 输出比对。半径使用未舍入的
`d <= r` 并仅排除中心 ID；不是道路、建筑入口距离、椭球测地线或完整校园
覆盖。原六点、来源、ODbL 与 2026-11-02 核对日期都保留。

这是脚本提议、真实程序计算、固定模板说明；不调用 LLM，不实现 MCP，
不提供自主 Agent 或模型内部思考。原创教程基于实际阅读的固定 MCP 官方
规范版本，解释工具、应用、回执和权限如何分开；见
[资源与科学范围](iteration-17-compliance.md)。

## 接进学习生态

新增“从调用提议，到能核对的结果”路线及三道自解释题。现在七条路线、
十八个永久问题、十一篇公开笔记，公开搜索 42 条元数据：页面10 / 实验9 /
笔记11 / 路线7 / 项目5。学习手记仍是同一个 v1 controller/key。

实际浏览器验证旧十五条原始记录打开不改写、导出不丢失、自动选到新问题；
从 AI Lab → 工具实验 → 指定自解释题不会记录完成。手动写新解释时，旧记录
逐条保持，未勾选的题目仍为未完成。原九条、十二条与存储失败/冲突恢复的
回归也继续通过。搜索只增加公开元数据，不进入私人手记。

AI Lab 的原 Mercator 流程链接、四步概念和边界说明保留；入口移除旧的
大写装饰标签、斜体碎片与重复卡片边框，采用同一淡紫磨砂系统和真实操作入口。

## 实际验证

| 命令或方式 | 结果 |
| --- | --- |
| `npm run build`、`npm test` | 构建及 ESLint/SCSS lint 通过 |
| `npm run test:atlas` | 87 项模型检查通过，其中 7 项新工具边界/数学/复算检查 |
| `docker exec ... bash tools/test.sh` | 真实 Jekyll：27 案例、149 断言；52 个 HTML、275 条内部链接通过 |
| `npm run test:atlas:browser` | 原地图、学习、观察台、搜索、评测、空间验证及新工具整套 Chromium 回归通过 |
| `npm run test:atlas:python` | 真实 Pyodide：三例、空列表异常、输出上限、无限循环超时、重载与停止通过 |
| 根路径 Jekyll + HTMLProofer | 同样 52 HTML / 275 内部链接通过 |
| 根路径工具与 practice 浏览器套件 | 深浅主题、390/768/1440，旧记录、恢复、下载与交互通过 |

源码级检查不代替浏览器。新模块另外检查了实际 JSON 下载、错误目录降级、
无 JS 资料可读、键盘跳转、减少动画动态切换、320px/短视口与 DOM 200% 字号。
这不是 Safari/Firefox、真实手机、真实 OS 中文输入法或外部资料新鲜度验证。

## 视觉实拍与修正

[完整审查](design-audit-iteration-17.md)保留初版问题与实际 lint 记录。
浏览器截图发现未定义的圆角变量和过长开场，已改为既有 token 与原生范围
disclosure；错误提示使用明确文字与即时焦点。一次有限回执动画只在操作时
发生，减少动画偏好变化会取消。

独立 fresh-context Hallmark finish review 为 **ship，0 个实质发现**，
记录见 [finish-review.txt](iteration-17/finish-review.txt)。复核确实打开了实际
页面并检查阶段、错误恢复、375/768/1440 布局、焦点、字段和控件。

最后的精确字段匹配、下载锚点兼容性和主入口样式收尾后，已重新构建，
再次通过新模块两种路径的浏览器检查、87 项模型检查、lint 和 Hallmark
真实 URL render（0 FAIL / 0 REFLEX / 0 WARN）。

- [原 AI 手机页](iteration-17/screenshots/before-ai-390.png)
- [新工具页，手机深色](iteration-17/screenshots/tool-390-dark.png)
- [实际结果，手机浅色](iteration-17/screenshots/tool-result-390-light.png)
- [错配回执，桌面深色](iteration-17/screenshots/tool-error-1440-dark.png)
- [AI 入口，桌面](iteration-17/screenshots/ai-after-1440.png)
- 原始记录：[构建](iteration-17/build-results.txt)、[浏览器](iteration-17/browser-results.txt)、[Hallmark](iteration-17/hallmark-results.txt)

## 预览

使用本 PR 最新 CI 的 `atlas-review-preview` 编译产物，按
[PREVIEW.md](PREVIEW.md) 解压后从包含项目目录的那层启动 Python HTTP 服务。
打开 `/Brook-ZzQq.github.io/playground/tool-calling/`、`explore/ai/` 与
`study/practice/#tool-contract`。源码 ZIP 无法直接当作编译页面预览。
