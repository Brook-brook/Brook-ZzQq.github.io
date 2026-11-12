# 第十轮：让前沿信息持续更新，也留下理解

2026-11-12（Asia/Shanghai）。`feat/atlas-iteration-10` 从第九轮 `46dd8bf`
继续。PR #9 尚未合并，本轮以 `feat/atlas-iteration-9` 为审查基线。
保留之前的来源目录、导读、地图、实验、学习路线及浏览器记录。
不修改默认分支、Pages 来源或生产发布工作流，不自动合并／部署。

## 本轮交付

- **持续发现**：受限 RSS / Atom 采集器、7 个公开订阅源，目标约每 2 小时。
  只提取标题、原始链接和源站时间，不复制正文或生成时事结论。
- **可追溯档案**：独立 `observatory-data` 分支按首次收集日（北京时间）归档，
  保留首次／最近变化时间、修订次数、最近 10 次旧元信息及 Git 提交历史。
  已收集的旧材料不会因 RSS 滚动窗口或源站失败而删除。
- **准实时页面**：可见且联网时每 5 分钟检查公共状态；新快照先提示，
  手动载入后才更新列表。支持主题／来源／关键词、按日历史和分批继续阅读。
- **本机学习沉淀**：每份收藏可写最多 2,000 字符的理解手记，保留材料版本；
  Markdown 导出含自己的实际记录，JSON 备份支持校验、预览和确认合并。
  本机已有手记优先，不上传私人文字、不推断已读或掌握程度。
- **兼容恢复**：物理存储 key 不变，旧 v1 清单在内存恢复，主动编辑时写 v2；
  历史收藏继续可用。存储损坏、禁用、配额不足和多标签页冲突保留导出能力。

自动发现始终标为 **needs_review／待核对**，不冒充选编导读、论文审查或事实
核查。发布时间、首次收集日和元信息修订有不同含义。源站、缓存与调度可能
延迟，不能承诺秒级实时、完整覆盖或永久可访问。

## 已实际启用的更新链路

GitHub 的 schedule 只在默认分支生效；当前默认分支仍是 master，未自动合并
工作流。因此没有把开发分支里的 cron 当成已经启动的后台任务。

实际启用的是 **更新 Brook 前沿观察台** 任务，约每 2 小时通过连接的 GitHub
工具检查公共状态，再以当前 blob SHA 更新 `observatory-ops` 的
`_data/observatory_trigger.json`。只有此受限提交触发 ops Actions，正常提交到
数据分支；有近期采集／触发或已有运行时跳过，成功保持安静，失败按实际情况
通知。此链路不依赖这次云工作区长期在线，不修改线上页面或私人笔记。

实际证据：

- [首轮真实采集 43179564962](https://github.com/Brook-brook/Brook-ZzQq.github.io/actions/runs/43179564962)：
  6/7 源成功响应，151 份去重元信息；欧洲议会 HTTP403，arXiv 订阅为空。
  成功响应不表示材料结论已验证，也不表示空订阅没有其他新研究。
- [连接工具触发验证 43181276068](https://github.com/Brook-brook/Brook-ZzQq.github.io/actions/runs/43181276068)：
  实际 contents 更新触发成功；因首轮尚不足一小时，采集租约正确跳过重复下载。
- [更新后 ops 验证 43183764868](https://github.com/Brook-brook/Brook-ZzQq.github.io/actions/runs/43183764868)：
  时间校验、日期修订与档案保全测试通过，数据校验及工作流成功。
- Chromium 无 mock 请求公共 status／index／每日 archive 均 HTTP200，摘要哈希、
  schema 和档案条数一致；没有产生私人阅读记录或浏览器控制台错误。

长期跨轮调度可靠性尚未观察。任务可在 ChatGPT Tasks 中按上述名称管理；
以后若经授权在默认分支启用原生 cron，应核对后移除重复调度。
欧洲议会本次不可访问，页面保留失败状态，不绕过访问限制。

## 设计与真实截图

沿用深紫／奶紫、系统字体、隔离的轻玻璃和 Mote。更新流是有分隔线的阅读
列表，侧栏解释来源健康，不改成三栏新闻仪表盘。没有新增动效库或持续动画。

| 状态 | Chromium 实际截图 |
| --- | --- |
| 修改前入口 | [1440px](iteration-10/screenshots/before-1440.png) |
| 更新后入口 | [1440px 深色](iteration-10/screenshots/intro-1440-dark.png) |
| 真实公共历史档案 | [桌面](iteration-10/screenshots/updates-1440-dark.png) · [手机浅色](iteration-10/screenshots/updates-390-light.png) |
| 理解手记与备份 | [桌面](iteration-10/screenshots/desk-1440-dark.png) · [手机](iteration-10/screenshots/desk-390-light.png) |
| 真实来源状态 | [含 HTTP403 的七源状态](iteration-10/screenshots/health-1440-dark.png) |

实际看图后，将手机筛选从单列改成搜索全宽＋其他字段双列，减少进入材料前的
纵向占用；390px 与桌面重新截图并查看。截图中的材料来自真实快照；手记明确
为浏览器测试示例，不代表 Brook 的阅读经历、个人政治观点或掌握情况。

## 实际验证

Node24、Ruby3.3 容器、Chromium；无新增项目依赖。自动失败路径使用明确的
合成 HTTP／XML fixtures；公共可用性另由上述 Actions 与无 mock 浏览器验证。

| 命令／场景 | 实际结果 |
| --- | --- |
| `npm run build` | CSS／JS 资产构建成功 |
| `npm test` | ESLint／SCSS 通过 |
| `npm run test:atlas` | 50 项通过，含采集、时间、版本、迁移与合并校验 |
| `bash tools/test.sh`（Ruby 容器） | 16 个真实 Jekyll 场景、88 断言通过；44 HTML、192 内链通过 |
| `npm run test:atlas:browser` | 全套通过：地图、旧实验、Study、RSS、学习路线、原观察台及持续更新／笔记 |
| `npm run test:atlas:python` | 真实 Pyodide：3 示例、异常、输出上限、死循环超时、重载与停止通过 |
| `npm run test:observatory:live` | 无 mock：1440 深色／390 浅色，公共状态、索引、档案、哈希／schema、控制台通过 |
| `--baseurl ''` | 根路径构建、HTMLProofer、观察台与持续更新完整浏览器套件通过 |
| 两种路径的 `check-pages-build.mjs` | 通过；不是把 Jekyll 原始源码当作发布产物 |

新交互覆盖 390／768／1440px × 深浅主题、axe、减少动画、无横向溢出、16px
输入字段、键盘焦点、无 JS 原文、搜索、展开更多、选入清单、输入／刷新恢复、
真实文件下载、明确应用快照、可见性轮询、档案与修订、HTTP／哈希／格式错误、
坏文件／超限文件、v1 恢复、合并优先级及存储失败时的手记保全。
最终复核还修正了长时间开页的过期提醒：快照日期不变时也定期重新计算年龄，
无需重载页面；两种路径下模拟连续打开 8 小时，旧材料与手记均保留。

Jekyll 构建护栏还验证无 JS 内置元信息的来源／域名／ID／日期和待核对状态，
防止只依赖客户端校验。根路径链接检查沿用 tools/test.sh 对 localhost 示例
链接的既有排除规则。原始汇总见 [构建](iteration-10/build-results.txt)、
[浏览器](iteration-10/browser-results.txt) 和 [公共实测](iteration-10/live-results.txt)。
Safari／Firefox、真实手机硬件与读屏软件未实测；axe 不等于完整无障碍认证。

## 主要文件与预览

- 采集：`_data/observatory_feeds.json`、`tools/observatory/*`、
  `.github/workflows/observatory-refresh.yml`、`assets/js/atlas/stream-models.js`。
- 页面：`observatory/index.html`、`assets/css/observatory.css`、
  `assets/js/atlas/observatory-stream.js`、内置实际快照及其 JSON 输出。
- 手记：`assets/js/atlas/observatory.js`、`observatory-models.js`。
- 护栏：`_plugins/observatory-validation.rb`、采集／模型／浏览器／真实构建测试。
- 维护：AGENTS、README、设计／路线／来源文档、资源声明与本轮审查。

PR 的 CI 成功后，下载 `build (3.3)` 的 **atlas-review-preview** 编译产物，
解压，在包含 `Brook-ZzQq.github.io` 子目录的那一层运行：

```sh
python3 -m http.server 8000
```

打开 `http://127.0.0.1:8000/Brook-ZzQq.github.io/observatory/`。
不要把 Code → Download ZIP 的源码直接交给 Python 服务器；它不编译 Jekyll。
有 Ruby／Node 的开发预览按 README 运行，根路径预览无需修改部署配置。

后续最有价值的学习工作：选一个持续议题，回看已归档的原始预测／评测及其
后续证据，写一份可核对的精读练习。自动收集不替代理解；跨设备私人手记、
全文搜索和自动摘要尚未实现。[来源／数据契约](OBSERVATORY_CONTENT.md)、
[资源与隐私核对](iteration-10-compliance.md) 一并维护。
