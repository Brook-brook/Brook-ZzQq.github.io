# 迁移方案：先增强研究过程，再增强网站

所有方案都是建议（C），本轮没有实现产品功能。BestBlogs 事实与边界见 [架构](architecture.md)、[AI 流水线](ai-pipeline.md)和 [许可审查](open-source-audit.md)。

## 1. 现有网站的真实基线

已阅读当前 README、AGENTS.md、design.md、package.json、_config.yml、布局/数据/页面与 Pages workflow；开发基线为 feat/atlas-iteration-5 的 `a4b24a603ff98236901cdc0de40d24b24b02fdf7`，不假定它已经合并或上线。

| 实际区域 | 本次源码核实（A） | 合适的结合点 |
| --- | --- | --- |
| 构建 | Jekyll + Markdown/YAML + 原生 JS/CSS/SVG；Node 资源构建；没有 React/Next 应用或服务端 API | 研究结果离线生成并人工审查，继续用静态内容发布 |
| Home | 笔记预览、精选校园作品、学习入口与真实构建记录 | 不改成新闻首页，不自动填虚构成长记录 |
| Study | `study/index.html` 读 `site.atlas_notes`；4 篇教程，分类/搜索/空状态已有 | 研究笔记可复用集合，但需要小幅扩展类型/元数据 |
| Projects | `_data/projects.yml` 驱动，区分已实现/待发布/计划中 | Research CLI 真正做完测试后再新增项目，不先宣称完成 |
| Explore | 6 个有来源的 WGS84 校园点、搜索/分类/收藏/图层、DOM/SVG | 保留校园作品；不把 /explore/ 偷换为聚合阅读器 |
| Playground / Knowledge | 博弈、C++ 语义、投影实验，真实 Pyodide Worker；知识关系图/旧 URL 保留 | 研究方法可以连接已有学习，不替换模块 |
| 外观/隐私 | Obsidian Glass、浅深主题、键盘/减少动效；公开身份 Brook | 不复制 BestBlogs 的 Ink/Amber/Paper 品牌，不公开私人资料 |
| 部署 | baseurl `/Brook-ZzQq.github.io`；Pages workflow push 仅 feature2 与手动触发 | 研究分支不触发该发布；不修改来源/配置，不自动发布 |

证据：[产品与开发说明](https://github.com/Brook-brook/Brook-ZzQq.github.io/blob/a4b24a603ff98236901cdc0de40d24b24b02fdf7/README.md#L1-L76)、[baseurl/集合](https://github.com/Brook-brook/Brook-ZzQq.github.io/blob/a4b24a603ff98236901cdc0de40d24b24b02fdf7/_config.yml#L164-L184)、[Study 模板](https://github.com/Brook-brook/Brook-ZzQq.github.io/blob/a4b24a603ff98236901cdc0de40d24b24b02fdf7/_includes/study-index.html#L1-L9)、[项目状态](https://github.com/Brook-brook/Brook-ZzQq.github.io/blob/a4b24a603ff98236901cdc0de40d24b24b02fdf7/_data/projects.yml#L1-L69)、[设计边界](https://github.com/Brook-brook/Brook-ZzQq.github.io/blob/a4b24a603ff98236901cdc0de40d24b24b02fdf7/design.md#L1-L26)、[发布触发](https://github.com/Brook-brook/Brook-ZzQq.github.io/blob/a4b24a603ff98236901cdc0de40d24b24b02fdf7/.github/workflows/pages.yml#L1-L13)。

一个容易忽略的真实约束：Study 列表和笔记布局现在把类型写成“实验室教程”，列表无条件渲染 lab_url；主页预览也有对应实验链接。[笔记布局](https://github.com/Brook-brook/Brook-ZzQq.github.io/blob/a4b24a603ff98236901cdc0de40d24b24b02fdf7/_layouts/atlas.html#L47-L58)、[主页预览](https://github.com/Brook-brook/Brook-ZzQq.github.io/blob/a4b24a603ff98236901cdc0de40d24b24b02fdf7/_includes/universe-notebook.html#L1-L6)。所以**仅把任何研究 Markdown 放进集合，还不能保证展示语义正确**。后续 B 必须让 type label 和实验链接可选，并保证旧教程的默认行为不变。本轮不提前改模板。

docs 被 Jekyll exclude，七篇研究报告目前供 GitHub 审查，不会自动出现在 Study 页面；[排除配置](https://github.com/Brook-brook/Brook-ZzQq.github.io/blob/a4b24a603ff98236901cdc0de40d24b24b02fdf7/_config.yml#L222-L231)。

## 2. 三方案比较

估算基于一个开发者每周 8–10 小时、现有 Python 基础与可用本地环境；是规划区间，不是交付承诺。A/B/C 的时间不含等待授权或修复外部 API 的时间。

| 维度 | A：最小学习 | B：网站增强 | C：独立 Research Agent |
| --- | --- | --- | --- |
| 范围 | 单源 RSS/Atom、本地去重、JSON、可选一次模型摘要、简单 CLI | 人工审阅的研究笔记，来源/证据/复核状态，接入现有 Study | 受限公开来源获取、去重、主题/摘要、CLI、运行记录，可选审阅后导出 |
| 技术价值 | 先建立 HTTP/数据契约/测试基础 | 内容建模与静态发布、可访问性、来源可信度 | 工具边界、失败/成本治理、效果评测和工程作品 |
| 难度 | 低到中 | 中；模型离线，不扩部署 | 中到高；先确定性流水线，再让 Agent 选择少量工具 |
| 时间 | 8–12 小时核心；首次模型/评测另加 4–8 小时 | A 后 12–20 小时 | A 后 40–60 小时；约 4–7 周 |
| 前置 | Python 函数、文件、HTTP、JSON、unittest | Jekyll front matter/Liquid、现有集合和链接测试 | A + 类型/Schema、CLI、缓存/状态、模型评测、网络边界 |
| API 成本 | 默认离线 $0；模型为可选且需先选供应商与预算 | 页面访问 $0 API；生成阶段使用 A 的预算 | 每次执行独立预算，按 token/重试计；不接无限自动任务 |
| 维护成本 | 低：一个适配器与小样本 fixture | 低到中：元数据、模板与来源更新 | 中到高：API/来源漂移、模型版本、失败记录、预算和权限 |
| 网站契合 | 高，完全隔离 | 高，保持 Home/Study/Projects/Explore 分工 | 工程项目契合，后台职责应独立于网站 |
| 作品集价值 | 能解释代码和测试胜过大而空 demo | 展示真实研究/表达，技术深度需实验支撑 | 有基准、失败演示、可复现记录才有较高含金量 |
| 主要风险 | 误把 HTTP 成功/JSON 有效当内容可靠 | 自动生成未经审阅内容、旧链接/类型回归 | 提示注入、成本失控、许可、错误引用、范围膨胀 |
| 优先级 | **P0：先完成** | **P1：最值得落地的小迁移** | **P2：有明确研究任务再独立做** |

成本比较只是一种预算方法：100 篇各 2000 输入/300 输出 token，假设 $1/M 输入、$4/M 输出约 $0.32；真实价格和额度必须重新查官方条款。不要将此当上游账单。免费层也可能有速率/隐私限制，网站不能暴露 Key。

## 3. A：学习闭环，范围要小

输入自己写的测试 XML → 解析/规范化 → 去重 → JSON → unittest；然后用本地 HTTP 学习超时/状态码，最后才允许接一份获准的真实 feed。AI 不负责采集、执行 shell 或决定发布。

可选 AI 阶段输入一篇获准使用的短文本，输出 summary、主题、证据位置和 review_status；没有模型调用时 summary/score 为 null。保留原文哈希、时间和版本，不用假分数装成智能。

验收：重复数据稳定去重；错 XML/URL/HTTP/超限返回可解释错误；无凭证仍能跑核心测试；一条失败不污染已有结果。可运行起点见 [学习路线](learning-roadmap.md)。

## 4. B：推荐的一个小功能

**Study 中的“可追溯项目研究笔记”**，先人工完成 1 篇，后续再支持离线辅助生成草稿。内容包含：

| 建议元数据（尚未实施） | 意义 |
| --- | --- |
| kind: research / title / category / summary / date | 保留现有教程默认；研究记录不冒充实验教程 |
| source_repo / source_commit / analyzed_at | 明确研究的是哪一版，而非永远“最新” |
| evidence_level / evidence_links | A/B/C/D 与可定位的文件/行号；笔记正文仍需逐项判断 |
| review_status / reviewed_at | draft/needs_review 不公开；reviewed 才由作者批准进入集合 |
| ai_assisted / prompt_version / model（可选） | 区分作者判断与模型辅助；未调用模型不虚填 |
| lab_url（可选） | 有真实实验才显示，不生成空链接或假按钮 |

~~~mermaid
flowchart LR
  S["公开且获准的来源"] --> L["独立本地研究 / 可选 AI 草稿"]
  L --> D["work/ 中的 JSON / Markdown 草稿"]
  D --> R{"Brook 核对证据、隐私与授权"}
  R -->|通过| P["PR：已有 atlas_notes + 最小模板兼容"]
  R -->|未通过| D
  P --> M["人工合并和另行批准发布"]
~~~

`_data/universe.yml` 的主页精选保持人工选择，不从 RSS 自动改写；`_data/projects.yml` 只在工程实际存在后更新。地图/学习实验/Knowledge URL、主题、移动端和减少动效行为保持。

回滚：撤销新增笔记和两处兼容模板改动即可；离线草稿不发布。不新增实时 API、账户、数据库、导航项或生产 Action。将来有“GeoAI 研究雷达”需求时，先作为研究笔记分类验证，不直接上线自动聚合页。

## 5. C：独立工程，而非把后端塞进 Jekyll

建议单独工程，Python 标准库起步，再按需要选择获审依赖。实际最小边界：

~~~mermaid
flowchart TD
  U["限定研究问题 / 来源清单 / 预算"] --> F["fetch adapter：HTTP 超时与大小上限"]
  F --> N["规范化、内容哈希、去重"]
  N --> A["可选 LLM adapter：摘要与主题"]
  A --> V["Schema / 引用 / 成本校验"]
  V --> O["JSON + 运行日志 + needs_review"]
  O --> E["显式人工审阅后导出草稿"]
~~~

第一版顺序固定，不先用多 Agent。后续 Agent 只允许从白名单工具中选动作，有最大步数/费用/时间；禁止从正文读取新工具 URL、凭证、shell 或发布指令。网络适配器检查重定向后的目的地、限制正文和请求数，缓存按内容/模型/Prompt 版本区分。

GeoAI 的工程差异应体现在研究问题与数据验证：论文/数据集版本、许可、CRS、单位、覆盖区域、空间分辨率、训练验证地域隔离。质量、相关性、可信度三个字段分开；不复制 BestBlogs 对基础教程/理论的减分偏好。

验收要能演示：重复链接/内容缓存命中、上游超时/429、错误 JSON/错误引用、预算耗尽、注入文本、无 Key 降级、人工导出开关；提供 12–20 条人工基准和错误样例，而不只展示成功录像。

## 6. 下一轮最适合的 Codex 任务

建议先做 A 的离线实验并解释代码，再批准下面 B。可直接使用的任务书：

> 从实际最新有效开发分支创建 review 分支。读取本目录七份报告；不改 Pages、导航、框架或配色。先检查 atlas_notes、Study 列表和 atlas 布局。为笔记增加向后兼容的 kind/type label；lab_url 缺失时不渲染“对应实验”，旧教程默认不变。人工编写一篇基于固定公开 commit 的研究笔记，用自己的语言，含来源、A/B/C/D、局限和复核日期；没有真实实验就不填实验链接。模型调用、自动采集和自动发布不在范围。检查来源许可，补本轮合规记录；只展示真实完成状态。测试新研究笔记、四篇旧教程、Study 搜索/分类、无 JS、键盘、390/768/1440、两种主题、减少动画、旧 Knowledge URL 和项目子路径；完成构建/链接检查，推 review 分支并创建 PR，禁止合并或发布。

这份任务是下一轮建议，**不构成本轮已经授权实施网站改动**。
