# 第十一轮：从信息流到专注研读

2026-11-12（Asia/Shanghai）。分支 feat/atlas-iteration-11，从未合并的第十轮
ccc0fb0 继续。原有地图、实验、学习路线、观察台来源／档案和本机记录保留。
没有修改默认分支、生产发布工作流或 Pages 来源，不自动合并／部署。

## 交付

观察台新增一间原生弹窗研读室。保存材料后可以直接读、写和对照，原来的
阅读桌仍然可用。一次实际基线测量中，手机阅读桌在视口下方约 5713px、
桌面约 3709px；新的“加入并研读”不再要求先跳到长页面后半。

- **就地研读**：从自动材料、导读、来源或旧清单打开；原文链接、收藏版本、
  收集／核对日、具体阅读问题与证据边界保留。来源入口不会冒充固定文档。
- **本机找回问题**：按标题、版本、阅读问题和自己的手记检索，组合主题与
  “有手记”筛选；筛选不替换正在编辑的材料，不上传查询或文字。
- **三类证据提纲**：AI 的任务／基线／预算，经济的实绩／预测／统计口径，
  政治的文本／状态／立场与独立证据。原生指南无需 JavaScript 也可阅读。
- **保留自己的话**：追加空白提纲，旧文字保持原样；超过 2,000 字符时拒绝
  插入，不截断手记。填写过的同一提纲不会重复插入，不自动生成结论。
- **并读另一份收藏**：同一空间查看第二份原始链接、版本、问题与已有手记。
  明确不同域名或多家转述不代表独立证据，不生成信任分或掌握分。
- **备份仍可用**：弹窗内可下载整个本机清单的 JSON／Markdown；存储失败或
  多标签页冲突在弹窗内直接提示，内存里的文字仍能导出。

沿用同一个观察台 controller、物理 key 和 v2 格式，没有新增存储或 v3 迁移。
打开既有 v1／v2 收藏不写入历史，也不静默更新其标题／版本；主动编辑才走
原有受保护的保存路径。原阅读桌同步显示修改，关闭时不重建入口而丢失焦点。

## 设计与实际修正

保留奶紫／深紫与 Mote。单一 heavy-glass 面板，固定标题／保存状态、一个
滚动内容区。桌面分资料检索与写作两区；390／768px 默认收起检索工具，
给正文留空间。没有新 UI／动画依赖、持续动效或全屏多层模糊。

实际看图后，将重复的材料说明放入“收藏版本与阅读边界”，缩小编辑区前的
空隙，提高 placeholder 对比度，并为重置按钮留出间距。键盘测试还发现
Shift+Tab 的边界行为，已补上弹窗内首尾循环；Esc 保留原生关闭及入口恢复。

| 状态 | Chromium 截图 |
| --- | --- |
| 修改前阅读桌 | [390px](iteration-11/screenshots/before-desk-390.png) |
| 初版 | [编辑区域被说明挤压](iteration-11/screenshots/before-room-1440.png) |
| 修正后专注研读 | [桌面深色](iteration-11/screenshots/room-1440-dark.png) · [手机浅色](iteration-11/screenshots/room-390-light.png) |
| 并读已有材料 | [桌面](iteration-11/screenshots/compare-1440-dark.png) · [手机](iteration-11/screenshots/compare-390-light.png) |

截图使用实际页面、真实选编材料；手记明确为测试示例，不代表 Brook 的
学习经历、政治观点或个人成果。自动元信息仍然待核对，未当成科研结论。

## 验证

结果随本轮实际日志保存，最终交付前核对全部命令：

| 检查 | 结果 |
| --- | --- |
| npm run build / npm test | 资产构建、ESLint、SCSS 通过 |
| npm run test:atlas | 54 项模型通过；包含本地检索、v1 兼容、保留原文的提纲追加与上限保护 |
| bash tools/test.sh（Ruby 容器） | 18 个真实 Jekyll 场景、93 断言；44 HTML、194 内链通过 |
| npm run test:atlas:browser | 完整通过；地图、旧实验、Study、学习路线、观察台及新研读室均覆盖 |
| npm run test:atlas:python | 真实 Pyodide 三示例、异常、输出上限、死循环超时、重载与停止通过 |
| 根路径构建／内链／研读室 | 构建与 HTMLProofer 通过；研读室完整双主题浏览器套件通过 |
| 两种路径的 check-pages-build.mjs | 通过，确认是已渲染的 Jekyll 产物而非源码 |

研读室覆盖 390／768／1440 × 深浅主题：无历史的空状态、直接加入研读、三类
提纲、保留／重复／超限、手记检索、并读、真实下载、键盘首尾循环与 Esc、
刷新恢复、axe、减少动画及无横向溢出；禁用／损坏／配额不足、双标签页、
旧 v1 不重写、历史标题安全渲染、无 JS 指南和不支持 dialog 时的原锚点退路。
没有把静态检查当成浏览器测试。Safari／Firefox、真实手机键盘和读屏软件
尚未实测；axe 不代表完整无障碍认证。

新增 Jekyll 护栏确保三个主题唯一、提纲有界，方法链接指向实际公开笔记；
移除／未发布的方法文档不能继续被研读指南引用。没有 bypass 研究发布规则。

## 主要文件与预览

- `_data/reading_guides.yml`：三类问题与空白提纲。
- `_includes/observatory-reading-{guides,room}.html`：原生指南与研读面板。
- `assets/js/atlas/reading-room.js`：本机检索、材料切换、并读与键盘交互。
- `observatory.js`／`observatory-models.js`：沿用单一状态、保存／导出与纯函数。
- `observatory-stream.js`／`observatory.css`：材料入口、响应式与材质。
- 构建护栏、模型与实际浏览器测试；AGENTS、README、来源／设计／路线与许可说明。

PR CI 成功后下载 **atlas-review-preview** 编译产物。解压后，在包含
Brook-ZzQq.github.io 子目录的那一层运行 `python3 -m http.server 8000`，打开
http://127.0.0.1:8000/Brook-ZzQq.github.io/observatory/ ，点击“专注研读”或任意
材料的“加入并研读”。源码 ZIP 需要 Jekyll 编译，不能直接当作这个预览产物。

原始证据：[构建](iteration-11/build-results.txt)、
[浏览器](iteration-11/browser-results.txt)。资源与隐私见
[本轮核对](iteration-11-compliance.md)、[数据契约](OBSERVATORY_CONTENT.md)。
网站页面仍是审查分支；既有两小时采集任务独立运行，没有为本轮重复创建任务。

下一轮推荐以一份 AI 评测或经济预测做完整的证据并读示例，固定版本并写出
适用边界。跨设备私人同步、自动答案和学习评分仍未实现。
