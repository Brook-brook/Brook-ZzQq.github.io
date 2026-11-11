# 第八轮：让学习有可以继续的线索

2026-11-11。分支 `feat/atlas-iteration-8`，基于第七轮 `4b77661`。
开始时工作区位于旧模板分支；本轮从远端恢复了第七轮，并未重建网站。
第七轮 PR #7 仍未合并，因此新 PR 以 `feat/atlas-iteration-7` 为基线。
没有修改 Pages 来源、生产工作流或线上网站，也没有自动合并。

## 现在能做什么

新的 `/study/paths/` 把已有六篇笔记和真实实验组织成四条开放路线。
保留第七轮淡紫／深紫、透明磨砂和原有 Mote；用阅读索引与分隔线组织
内容，手机上目录自然换行，桌面目录可随阅读保持可见。

| 路线 | 步骤 | 学习闭环 |
| --- | --- | --- |
| 从 Python 到可核对的数据 | 3 | 输入与异常 → RSS 去重 → 源码证据 |
| 在空间分析前，先问清模型 | 2 | 墨卡托局部尺度 → 校园代表点与来源 |
| 看见对象背后的资源 | 2 | 浅／深复制 → 生命周期与 RAII 边界 |
| 把策略和最优分开看 | 2 | 个人与集体收益 → 纯策略求解范围 |

每一步都有阅读、实际存在的实验入口（如适用）、准确的自检问题，以及
可选的本机手记。每条路线末尾给一个小作品方向，不把作品视为已经完成。
Home、Study、Playground 都有入口；文章和相关实验由同一份路线数据生成
返回链接。保留 Knowledge、原有文章地址、校园地图及旧实验。

## 个人记录的实际行为

- 只记录主动勾选和填写；阅读、打开实验、停留时间不产生完成记录。
- 每步可取消自检、写最多 2000 UTF-16 字符的手记；刷新可恢复。
- 继续入口优先选择有记录且未完成的路线，再指向其中第一个未自检步骤。
  多条路线有记录时按目录顺序选择，不假称记录了最近访问或掌握程度。
- 没有登录、上传、云端同步或自动发布。数据仅在当前来源的浏览器
  `brooks-universe.learning.v1` 中，以未加密的本机数据保存。
- JSON 导出由使用者主动下载。导入最大 256 KB，严格校验版本、步骤、
  类型和长度；先展示可补入的条数，再确认合并。现有非空记录优先。
- 损坏／未知格式的旧存储不被覆盖；禁用存储或配额不足时保留本页内容，
  明示无法持久保存，仍可导出。其他标签页修改存储后暂停本页自动保存，
  避免静默覆盖，不把它包装成多端同步。
- 清除需要确认，只删除学习手记的 key，不动主题和校园收藏。
- 无 JavaScript 仍可阅读全部路线、问题和资源链接。

## 实际截图与复审

截图来自本地编译页面的 Chromium，非生成效果图。已查看桌面深色、手机
浅色、展开手记和备份错误状态；测试还保存六种尺寸／主题组合的完整截图。

| 状态 | 截图 |
| --- | --- |
| 桌面深色入口 | [1440px](iteration-8/screenshots/paths-1440-dark-viewport.png) |
| 手机浅色入口 | [390px](iteration-8/screenshots/paths-390-light-viewport.png) |
| 桌面手记 | [展开并自检](iteration-8/screenshots/paths-1440-dark-entry.png) |
| 手机手记 | [输入与触摸布局](iteration-8/screenshots/paths-390-light-entry.png) |
| 手机导入错误 | [控件旁的明确反馈](iteration-8/screenshots/paths-390-light-backup-error.png) |

截图复审发现：原先备份区的错误只更新页面顶部状态，手机用户在页面
底部看不到结果。已改为在备份控件旁显示读取、错误、合并、取消和清除
反馈，同时保留存储失败提醒。相应浏览器测试覆盖了错误不能遮蔽存储警告、
以及存储不可写时导入仍明确为本页暂存。继续提示也改为“已有的线索”，
不暗示未实现的最近访问跟踪。没有空学习链接或无功能的升级按钮。
输入复审还修正了未变状态的重复更新：继续输入手记时，不再反复重写自检／
已保存的 live region；浏览器用 MutationObserver 验证实际输入时提示不变。

## 验证

本地 Node 24.19.0；Ruby 3.3 容器恢复仓库既有依赖，未新增 manifest／lock
依赖。以下结果为实际执行；构建后固定产物再执行浏览器测试。

| 命令／检查 | 实际结果 |
| --- | --- |
| `npm ci`、`npm run build` | 成功，保留原资产构建链 |
| `npm test` | ESLint、SCSS 检查通过 |
| `npm run test:atlas` | 28 项通过，含 8 项学习记录模型测试 |
| `bash tools/test.sh`（Ruby 容器） | 12 个真实 Jekyll 场景、77 项断言通过；HTMLProofer 41 文件、176 内链通过 |
| `npm run test:atlas:browser` | 全套通过：原地图／实验、Home、Study、RSS 及新增学习路线 |
| `npm run test:atlas:python` | 真实 Pyodide：3 个示例、异常、输出上限、死循环超时、重载和停止通过 |
| 学习页最终复测 | 390／768／1440 × 深浅主题、axe、键盘、刷新、导入导出、取消／清除、无额外请求通过 |
| 存储边界测试 | 禁用、损坏、配额不足、两个真实标签页、无 JS 均通过 |
| `--baseurl ''` 构建、HTMLProofer、学习浏览器套件 | 通过，保留与正常构建相同的 localhost 排除规则 |
| `node tools/check-pages-build.mjs` | 项目子路径与根路径产物均通过 |

全套回归后对继续提示和无匹配路线的文章返回导航做了小修，最终构建与
两种 baseurl 的学习套件再次通过。第一次回归期间曾同时重建预览目录，
造成测试读到临时缺失页面；已串行化并在稳定产物上重跑全套成功。
浏览器结果见 [原始记录](iteration-8/browser-results.txt)，构建与模型结果见
[验证记录](iteration-8/build-results.txt)。仅声明 Chromium 的实际验证；
Safari／Firefox 未实测，人工使用反馈和长期学习效果尚待观察。

## 主要文件

- `_data/learning_paths.yml`、`study/paths/index.html`：课程线索与阅读界面。
- `assets/js/atlas/learning-models.js`、`learning.js`：版本化数据、存储、继续与备份。
- `assets/css/learning.css`：沿用共享 tokens 的路线与手记布局。
- `_includes/*learning-paths.html`、`_layouts/atlas.html`：文章／实验返回路线。
- `_plugins/learning-path-validation.rb`：在公开笔记过滤后校验引用与稳定 ID。
- `tests/learning-*`、`tests/study-publication.rb`：模型、浏览器及真实构建边界。
- `README.md`、`AGENTS.md`、`docs/STUDY_CONTENT.md`：后续维护与隐私约束。

没有新外部资源、字体、依赖或地图数据；[合规记录](iteration-8-compliance.md)
与 THIRD_PARTY_NOTICES.md 已更新。

## 如何预览

第三轮以后属于独立审查分支；现有线上 URL 不会因新 PR 自动更新。
在 PR 的 CI 成功后进入 `build (3.3)`，下载编译产物
`atlas-iteration-5-preview`（保留的历史名称，内容来自该次运行）。解压后，
从**包含 `Brook-ZzQq.github.io` 子文件夹的目录**启动：

```sh
python3 -m http.server 8000
```

打开 `http://127.0.0.1:8000/Brook-ZzQq.github.io/study/paths/`。
不要直接用 Python 服务源码 ZIP，Python 不会处理 Jekyll、Liquid 或 SCSS。
有 Ruby／Node 时按 README 构建后，也可 `python3 -m http.server 8000 --directory _site`。

## 下一步

优先把一条路线做深：补独立编写的解题过程、常见误解与更细的实验反馈，
再扩展 RAII／移动语义或公共物品博弈。跨设备记录、自动诊断、课程评分和
真实研究 Agent 都尚未实现；需要单独界定数据与授权边界。
