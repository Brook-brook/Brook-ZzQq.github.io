# Brook 网站检查 · 2026-11-19

## 范围与基准

通过已连接的 GitHub 工具核对实际分支：默认分支为 `master`
（`ae677a8e`），完整开发版本为尚未合并的 `feat/atlas-iteration-31`
（`e9e4756f`）。本次从后者创建 `fix/site-audit-2026-11-19`，
不改默认分支、Pages 设置、生产工作流或观察台运行/数据分支。

当前没有可调用的 Chrome 扩展控制工具，也没有 Cloud Desktop 控制能力。
本次实际浏览器检查使用仓库已有 Playwright 与无头 Chromium，对真实
Jekyll 构建产物操作，实际浏览器版本为 Chromium 154.0.8037.57。
工作区网络不允许访问 Pages 主机，因此不把开发分支
的本地检查称为线上验证；没有创建 Sites 项目、迁移框架或部署。

## 当前结构与功能

网站使用 Jekyll、Markdown/Liquid、原生 JavaScript/CSS/SVG。
`_layouts/atlas.html` 提供公共导航、主题和搜索；旧 Chirpy 博客仍保留。

| 入口 | 已有功能 |
| --- | --- |
| Home / Projects / About | 交互笔记预览、学习路线、作品与开发状态、实际开发记录 |
| Explore | 紫金港六个有来源的 WGS84 代表点、搜索、分类、图层、收藏、拖动与缩放 |
| Study / Knowledge | 33 篇公开笔记、知识关系、分类与类型筛选、来源、代码与实验链接 |
| AI 基础 / AI 与 Agent / Paths / Practice | 13 主题基础地图、开发路径、16 条路线与 53 道手动自查题、本机手记 |
| Observatory | 公开来源目录、RSS/Atom 元信息、来源健康、研读室、本机阅读记录与导出 |
| Playground | 博弈、C++、投影、评测、空间验证、工具调用、Agent、检索、回执、梯度与词项实验 |
| Search | 惰性公开元信息索引、81 个条目、别名、高亮、类型筛选、续看和键盘操作 |

## 修改前检查

- 对 10 个主要入口分别检查 390、768、1100、1440px，共 40 个页面状态。
  未发现页面脚本异常、HTTP 错误或页面横向溢出；390/1440px 的 20 个状态
  通过 axe 的 WCAG A/AA 自动检查。自动检查不等于完整人工无障碍认证。
- 实际检查截图确认深紫色玻璃风格、手机折叠菜单和桌面导航正常。
- 在 390px 和 1440px 均复现：Study 输入 `C++` / `CPP` 返回 0 篇，
  点击 C++ 分类却有一篇笔记；全站搜索 `CPP` 能找到该笔记、实验和路线。
- 390×844px 首页初始总高 12817px；路线区高 2679px，校园作品到
  y=3531px 才出现；26 条开发记录占 6699px。未操作或折叠任何内容。
- 已核对的生产工作流仍监听 `feat/atlas-iteration-2`，其最近一次
  [成功发布运行](https://github.com/Brook-brook/Brook-ZzQq.github.io/actions/runs/41444046955)
  来自该分支；31 轮 PR 仍未合并。不能据此声称开发版已经公开发布。

## 三个值得改进的地方

1. **优先：统一 Study 与全站搜索的匹配规则。** Study 漏掉可见分类，
   只用连续字符串比较，也不处理全角写法和已定义的别名。学习者知道主题
   却收到错误的空结果。本次修复这一项，保留日期顺序、筛选交集与分享链接。
2. **精简首页的信息层级。** 当前所有路线和开发记录一起铺开，手机阅读
   成本高。建议常显少量入口/最近记录，其余用原生折叠或目录入口保留。
   本次不顺带重排页面或隐藏路线。
3. **整理开发版到公开版的发布链。** 多个尚未合并的开发分支与生产监听
   分支分离。建议先集中审查一个候选发布版本，并明确它的预览和实际发布
   状态。本次只创建可审查 PR，不自动合并、改发布源或部署。

## 本次实施与验证

Study 的 `data-search` 补入已经显示的分类；页面筛选和全站搜索共用
`matchesTerms`，处理既有显式别名、NFKC 全角归一化和空格分词交集。
Study 只筛选，不使用全站搜索的相关度排序，因此仍保留原日期顺序。
没有新增框架、依赖、接口、存储或查询上传。

新增浏览器回归先在冻结的旧构建上失败：`C++` 预期 1 篇，实际 0 篇。
修复后的独立截图确认 `CPP` 在手机/桌面、深浅两主题均为 1 篇，
显示《复制了对象，为什么数据仍然共享？》及原阅读/实验链接。

| 检查 | 实际结果 |
| --- | --- |
| `npm run build` / `npm test` | 通过 |
| `npm run test:atlas` | 173 项通过，0 失败/跳过 |
| 实际 Jekyll 发布边界检查 | 54 案例、350 断言，0 失败 |
| Jekyll + HTMLProofer | 根路径与项目子路径均通过；各 82 个文件、604 个内部链接 |
| Pages 产物结构检查 | 通过，实际构建布局、资源、入口与旧包均存在 |
| 根路径 Study 浏览器回归 | 390/768/1440px × 深浅主题通过；别名、全角、多词、分享、排序、键盘、空结果、axe；33 篇无 JS 阅读通过 |
| 实际浏览器 Python | 七个既有例子真实执行、异常、输出上限、超时、重载和停止检查通过 |
| 项目子路径浏览器回归 | 全部 36 个配置入口通过，涵盖现有地图、搜索、知识库、手记与交互实验 |
| 搜索关键状态的控制台专项 | 390/768/1440px × 深浅主题，Study 别名、全站搜索、筛选空结果/重置；0 console.error、页面异常或同源 HTTP 错误 |

首轮本地预览服务进程在长回归期间退出，原命令没有整体正常结束。保留
前 30 个入口顺序完成的结果后，重启相同的冻结构建，重新执行第 31–36
个入口；补跑六项均退出 0。控制台专项首次连接失败，也在恢复服务后
重新跑完六个状态并通过。没有把进程中断记作测试成功。

功能代码已提交至独立修复分支，见
[PR #32](https://github.com/Brook-brook/Brook-ZzQq.github.io/pull/32)。
GitHub Actions 的最新结果以该 PR Checks 为准，本表记录实际完成的本地验证。

### 实际前后截图

截图为真实浏览器中的 Study 索引区域，使用相同的 `CPP` 测试词；不是设计
稿或合成图片。完整标题、计数、分类、阅读和实验入口可直接核对。

| 尺寸 / 主题 | 修改前：0 篇 | 修改后：1 篇 |
| --- | --- | --- |
| 390px / 深色 | [前](site-audit-2026-11-19/before-study-390-dark.png) | [后](site-audit-2026-11-19/after-study-390-dark.png) |
| 390px / 浅色 | [前](site-audit-2026-11-19/before-study-390-light.png) | [后](site-audit-2026-11-19/after-study-390-light.png) |
| 1440px / 深色 | [前](site-audit-2026-11-19/before-study-1440-dark.png) | [后](site-audit-2026-11-19/after-study-1440-dark.png) |
| 1440px / 浅色 | [前](site-audit-2026-11-19/before-study-1440-light.png) | [后](site-audit-2026-11-19/after-study-1440-light.png) |

### 预览

本次 PR 以未合并的 `feat/atlas-iteration-31` 为基准。等待该 PR 的 CI
通过后，下载其 `atlas-review-preview` 编译产物；按
[已有预览说明](PREVIEW.md) 在包含 `Brook-ZzQq.github.io` 文件夹的父目录
启动 HTTP 服务，再打开 `/Brook-ZzQq.github.io/study/` 测试 `CPP`。
直接用 `python3 -m http.server` 服务源码目录不会运行 Jekyll。

本次检查的功能源码：`_includes/study-index.html`、
`assets/js/atlas/site.js`、`assets/js/atlas/search-models.js`；
对应回归位于 `tests/study-browser.mjs`、`tests/search-models.test.js`。
另有 README、`docs/ROADMAP.md`、`THIRD_PARTY_NOTICES.md`、本审计与
`docs/site-audit-2026-11-19-compliance.md` 五份说明，以及八张真实截图，
共 18 个修改/新增文件。
