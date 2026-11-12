# 第九轮：AI 前沿与全球观察

2026-11-12（Asia/Shanghai）。分支 `feat/atlas-iteration-9`，基于第八轮
`0536d46`。第八轮 PR #8 仍未合并，因此本轮 PR 继续以该开发分支为基线。
开始时工作区干净，未覆盖旧工作、修改 Pages 来源、改动生产工作流或自动部署。

## 交付

新增 `/observatory/`，导航名 Observe，Home 开发记录与 Study 都有入口。
延续淡紫／深紫、系统字体、隔离的玻璃材质和原有 Mote，保持地图与学习模块。

- **18 个来源**：AI 研究与评估、全球经济、国际政治；区分原始材料、机构
  分析和新闻报道，每项写明用途、问题、语言与局限。
- **四份有版本的导读**：连接 AI 新论文、宏观展望、AI 与贸易、政策文本。
- **两篇中文方法教程**：读 AI 评测证据、读全球政经；AI 教程另含已核对的
  Hugging Face 官方中文课程入口和先修提示，保留真实 Python 实验链接。
- **可操作的阅读桌**：主题／类型／关键词筛选、主动收藏、起步清单、刷新
  恢复、移除、确认清除，以及下载带问题和空白记录模板的 Markdown 计划。

本轮是选编来源与学习工具，**没有实现实时新闻抓取或自动更新**。
目录显示真实核对日期，超过 30 天会提醒回原站检查；不会每次构建自动把
日期改为当天，也不生成权威分、政治立场判断或学习掌握度。

## 材料与证据

核对通过连接的网页工具完成，包含正式来源页／摘要／版本与可见用途，
不是声称审阅全部论文或复现实验。18 项完整记录在 `_data/observatory.yml`。

| 方向 | 起步来源举例 | 需要保留的边界 |
| --- | --- | --- |
| AI | arXiv、OpenReview、OpenAI、Anthropic、Google DeepMind、Qwen、Stanford AI Index、NIST | 预印本、作者评测、评审决定、独立验证与风险框架各有含义 |
| 经济 | IMF、World Bank、BIS、WTO、Federal Reserve、国家统计局 | 事实／估计／预测、统计口径、截止时间与情景条件 |
| 政治 | 联合国图书馆、EUR-Lex、Reuters、AP | 草案／通过文本／执行结果、机构立场、具名来源与独立佐证 |

本期原文均有明确身份与版本：

1. [Contrastive Discovery v1](https://arxiv.org/abs/2611.14514v1)：2026-11-10
   提交，比较竞争解释的科学发现 Agent 方法。仅核对摘要和版本，未复现，
   未独立确认论文自报的会议接收状态。
2. [IMF WEO 2026-10-13](https://www.imf.org/en/Publications/WEO/Issues/2026/10/13/world-economic-outlook-october-2026)：
   用于练习区分预测、统计截止日与情景条件，未把预测当作实绩。
3. [WTO 2026-10 PDF](https://www.wto.org/english/res_e/booksp_e/gtos1026_e.pdf)：
   固定到该版文件，包含 AI 相关商品贸易分析；不把相关变化当作因果结论。
4. [Regulation (EU) 2024/1689](https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng)：
   明确为公布文本阅读练习，现行修订、合并版本与适用状态须继续在原站核对。

研究中修正了 BIS／AP 的旧入口；使用可读的联合国图书馆指南替代仅返回
加载界面的门户，并用 IMF 官方版本替代本次返回 403 的 eLibrary 地址。
访问结果仅描述本次工具观察，不能保证各地区／订阅环境今后都可访问。

## 阅读桌的数据行为

收藏只记录主动选择的材料，打开页面、点击原文不算已读或已掌握。
专用 key 为 `brooks-universe.observatory.v1`，与第八轮学习手记隔离。
保留标题、HTTPS 链接、版本、核对日期、问题与边界等公开元信息；条目离开
当前目录后仍显示为历史收藏并可导出，不静默删除。它不保存原文副本。

最多 60 项／256 KB JSON，校验版本、字段、日期、唯一 ID 与无凭证 HTTPS。
历史标题使用 textContent 渲染。Markdown 保留原始问题与版本，解释与证据
由学习者自己填写。没有账号、同步、上传、访问历史或私人答案采集。

存储被禁用、损坏或配额不足时保留本页内容、明示暂存并允许导出；坏的
原始数据不覆盖。收到其他标签页的存储变化时暂停写入。清除需确认，只删
观察台 key，保留学习手记、主题和校园收藏。无 JS 仍可读所有来源和导读。

## 真实截图与修正

| 状态 | 实际 Chromium 截图 |
| --- | --- |
| 桌面深色入口 | [1440px](iteration-9/screenshots/intro-1440-dark.png) |
| 手机浅色入口 | [390px](iteration-9/screenshots/intro-390-light.png) |
| 桌面阅读桌 | [已选八份材料](iteration-9/screenshots/desk-1440-dark.png) |
| 手机阅读计划 | [下载按钮与清单](iteration-9/screenshots/desk-390-light.png) |
| 桌面来源目录 | [筛选与来源](iteration-9/screenshots/sources-1440-dark.png) |
| 修正前 | [下载入口被长清单挤到下方](iteration-9/screenshots/before-desk-1440-dark.png) |

实际查看桌面／手机截图后，把下载按钮移到清单上方、压缩重复状态文案，
使主操作在长清单中仍可见；保留存储异常的完整提示。搜索还纳入主题、类型、
语言与链接，验证“国际政治”和“新闻报道”能检索到相应分组。新导航在
1051／1280px 也检查了品牌、导航与主题开关的实际边界，未发生重叠。

## 实际验证

使用已有 Node 24 和 Ruby 3.3 容器；没有新增依赖。浏览器为 Chromium。

| 检查 | 结果 |
| --- | --- |
| `npm run build` | 资产构建成功 |
| `npm test` | ESLint 与 SCSS 通过 |
| `npm run test:atlas` | 36 项通过，含 8 项新模型测试 |
| `bash tools/test.sh`（Ruby 容器） | 14 个真实 Jekyll 场景、82 断言通过；44 个 HTML 文件、191 条内链通过 |
| `npm run test:atlas:browser` | 全套通过，覆盖原地图、知识、Python 错误路径、Study、RSS、学习手记及新观察台 |
| `npm run test:atlas:python` | 真实 Pyodide 的 3 示例、异常、输出上限、死循环超时、重载与停止通过 |
| 观察台最终复测 | 390／768／1440 × 深浅主题、axe、组合筛选、关键词／元信息搜索、快照恢复、真实导出与两篇教程通过 |
| 边界 | 禁用／损坏／配额不足、多标签页、历史收藏安全显示、过期提醒、无 JS、确认清除、保护其他功能、操作不发起 HTTP 请求通过 |
| 根路径 | `--baseurl ''` 构建、HTMLProofer 与最终观察台完整浏览器套件通过 |
| Pages 产物 | 根路径与项目子路径的 `check-pages-build.mjs` 均通过 |

全套回归后补入更完整的搜索元信息，并重跑两种路径下观察台的最终套件，
没有在浏览器测试期间重建其正在访问的目录。
原始结果见 [构建记录](iteration-9/build-results.txt) 与
[浏览器记录](iteration-9/browser-results.txt)。Safari／Firefox、辅助技术实际
语音播报与长期学习效果未实测；axe 检查不代表完整无障碍认证。

## 文件与预览

主要文件：`_data/observatory.yml`、`observatory/index.html`、
`assets/css/observatory.css`、`assets/js/atlas/observatory*.js`、
`_plugins/observatory-validation.rb`、两篇 `_atlas_notes/reading-*-evidence.md`、
`tests/observatory-*`，以及导航／Study／开发记录入口与维护文档。

PR 的 CI 成功后下载 `build (3.3)` 的 `atlas-iteration-5-preview` 编译产物
（保留的历史名称）。解压，在**包含 `Brook-ZzQq.github.io` 子目录的目录**运行
`python3 -m http.server 8000`，再打开：

`http://127.0.0.1:8000/Brook-ZzQq.github.io/observatory/`

源码 ZIP 需要先经 Jekyll 构建；有 Ruby／Node 可按 README 开发预览。
现有线上 URL 不会因这次开发分支或 PR 自动更新。

下一轮优先把一个主题做深：补基础概念、精读例子和证据反馈，再考虑有来源
追溯与审查边界的元数据刷新。当前不宣称有后台爬虫、实时聚合、云端笔记或
自动事实核查。[资源与隐私核对](iteration-9-compliance.md)、
[来源维护规则](OBSERVATORY_CONTENT.md)已一并提交。
