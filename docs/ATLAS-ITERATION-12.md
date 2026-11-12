# 第十二轮：把主站的学习线索接起来

2026-11-12（Asia/Shanghai）。`feat/atlas-iteration-12` 基于尚未合并的
第十一轮 `748a582`；PR 以 `feat/atlas-iteration-11` 为基线。保留原站功能、
笔记与私人记录格式，不修改生产发布来源或自动合并。

## 本轮交付

- **公开内容搜索**：导航放大镜或 Ctrl/⌘ K 打开原生搜索面板，按类型组合
  标题、摘要与关键词检索。32 个入口来自 8 篇公开笔记、4 条路线、6 个
  实验、5 个作品记录和 9 个页面入口。不是全文或新闻搜索。
- **完整目录**：`/search/` 在 Jekyll 构建时直接输出全部入口。无 JS 仍能
  阅读、点击和用浏览器页面查找；不支持 dialog 时入口直接打开目录。
- **首页学习入口**：在笔记摘录之后、校园作品之前展开四条真实路线，连接
  笔记、实验与自查问题。问题数不是掌握率，也不读取/推断个人进度。
- **作品筛选**：关键词与已实现/已实现待发布/计划中状态组合，显示真实
  结果数、空状态与清除动作。原生实现说明和各作品链接保留；计划记录
  没有伪造演示。搜索跳回同页作品时会恢复被筛掉的目标并关闭面板。

搜索索引首次打开时才读取，当前产物 11,873 字节，不按键发送请求。
读取有 8 秒超时、512KiB/1000 条边界及重试；路径受当前 baseurl 约束。
所有标题安全作为文字渲染。输入只留在当前内存，不写 URL、localStorage
或历史；不读取私人手记，也不混入自动消息、草稿、未核对研究或旧模板正文。
没有引入第三方包、账户、搜索服务或另一套存储。

## 设计与实际修正

沿用深紫/奶紫、Mote、现有三档玻璃与系统字体。搜索使用一个 heavy-glass
原生面板与条目分隔线；首页使用路线列表，与原笔记标签和作品图片区分。
手机导航缩短为 Brook，保留完整 accessible name；原 1051px 菜单边界不变。

初版实际 Chromium 截图显示手机面板标题换行偏碎、分类按钮挤在一起。
已缩短标题，补齐分类间距。检查还补上同页搜索定位被隐藏作品的行为。
连续开关测试发现原生 close 事件可能晚于重新打开到达，已加过期事件保护、
可靠的 Esc 关闭和隐藏入口的焦点退路；修改键点击保留原生新标签行为。
有/无 JavaScript 的目录默认顺序保持一致，避免初载条目跳动。
44px 控件、16px 输入、键盘首尾循环、Esc/焦点恢复、减少动画与既有不透明
玻璃降级保持可用；没有持续动画或地图上的额外模糊。

| 状态 | 实际截图 |
| --- | --- |
| 修改前首页 | [手机](iteration-12/screenshots/before-home-390.png) · [桌面](iteration-12/screenshots/before-home-1440.png) |
| 新首页路线 | [手机深色](iteration-12/screenshots/home-390-dark.png) · [桌面浅色](iteration-12/screenshots/home-1440-light.png) |
| 搜索面板 | [手机深色](iteration-12/screenshots/search-390-dark.png) · [桌面浅色](iteration-12/screenshots/search-1440-light.png) |
| 作品筛选 | [手机浅色](iteration-12/screenshots/projects-390-light.png) |

## 主要文件

- `_plugins/site-search-index.rb` / `_data/site_search.yml`：通过发布过滤的公开
  元信息与真实入口；`assets/data/site-search.json` 输出有界静态索引。
- `search/index.html` / `_includes/site-search*.html` / `site-search.css`：完整
  目录、原生面板、类型筛选、双主题布局。
- `search-models.js` / `site-search.js` / `site.js`：校验、排序、本地检索、
  按需读取、失败退路和键盘导航。
- 首页路线 include、`universe.js/css`、Projects 模板：内容发现与真实状态筛选。
- 发布测试、搜索模型与浏览器套件；README、AGENTS、设计/路线/许可说明。

## 预览与范围

PR 的 CI → **build (3.3)** → **atlas-review-preview** 是已编译预览产物。
解压后，在包含 `Brook-ZzQq.github.io` 子目录的那层运行：

```sh
python3 -m http.server 8000
```

打开 http://127.0.0.1:8000/Brook-ZzQq.github.io/ ，看首页路线，点右上角
放大镜搜索，或直接打开 `/Brook-ZzQq.github.io/search/`、`/projects/`。
GitHub 源码 ZIP 仍需 Jekyll 编译，直接用 Python 服务源码会缺少模板处理。

没有实现跨设备私人同步、公众号/知乎 API 接入、全文搜索、学习评分或新
自动采集。原观察台与既有采集任务保持原状。下一轮优先为一条真实路线
增加“问题—实验—解释—反例”的完整教学示例，继续改善学习内容本身。

资源、隐私与许可见 [本轮核对](iteration-12-compliance.md)，修改前范围见
[审计](iteration-12-audit.md)。下方验证记录以实际执行结果为准。

## 验证记录

| 命令/范围 | 实际结果 |
| --- | --- |
| `npm run build` | 既有 Rollup/PurgeCSS 资产构建通过 |
| `npm test` / `npm run test:atlas` | ESLint、SCSS 通过；58 项模型测试通过 |
| `bash tools/test.sh`（Ruby 3.3 容器） | 20 个真实 Jekyll 场景、112 断言；45 HTML、205 内链通过 |
| `npm run test:atlas:browser` | 完整 Chromium 回归通过：主站、地图、旧实验、Study、学习路线、观察台、自动流、研读室与新搜索 |
| `npm run test:atlas:python` | 真实 Pyodide：三个示例、异常、输出上限、死循环超时、重载和停止通过 |
| 根路径构建/HTMLProofer | 45 HTML、205 内链通过；无项目子路径依赖 |
| 两种路径的 `check-pages-build.mjs` | 均确认已渲染布局、14 个首页本地资产、主要路由与旧 bundle |

完整回归后修正焦点/快速开关边界，再针对新搜索、路线入口和作品筛选执行
两种 baseurl 的整套浏览器复测。覆盖 390/768/1440 × 深浅主题、axe、真实
DOM 筛选与同页定位、懒加载/只读取一次、输入不发送/不碰私人记录、键盘
首尾循环/快速 Esc/恢复、菜单中快捷键、减少动画、无 JS、无 dialog、失败
重试；320/1051/1280 导航无重叠。原生目录与增强目录的默认顺序一致。

截图在真实 Chromium 页面上检查并据此修正。Safari/Firefox、真实手机键盘
及读屏软件未实测；没有把 axe 当成完整无障碍认证。观察台的 HTTP 样本回归
不代表重新核对所有公共新闻来源，本轮没有发起新的采集或平台接入。

原始证据：[构建/模型/双路径](iteration-12/build-results.txt)、
[完整浏览器回归与最终复测](iteration-12/browser-results.txt)。
