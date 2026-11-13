# 第十九轮：同一份账本，分开核对两个目标

基于已推送的第十八轮 `27790a1`，分支 `feat/atlas-iteration-19`。第十七、
十八轮 PR 分别保留独立差异，本分支包含前两轮代码；没有自动合并或部署。

## 真实可操作的公共物品实验

`/playground/public-goods/` 可调整 2–8 人、0–10 倍的一位小数倍率及每人
0–20 点整数贡献。收益来自实际本地计算：保留点数加上等分的公共返还。
旁边即时显示玩家收益、固定别人时的改善、全员核对账本、当前纯策略均衡
与点数总和最优。两者是不同问题，后者也不自动等于公平。

默认四人各投10、倍率1.6时，各得26，总计104。玩家1单独改为0得32，
但全员都改为0时各得20。实验明确分开单方与同时改变，避免拼接不可能
同时发生的收益。`m=n` 时每个纯策略组合都是均衡，`m=1` 时每个组合总和
相同；程序以整数倍率十分数分类等号，不按显示值的舍入结果判断。

三种真实组合的总收益条形对照披露自己的归一化尺度。可展开的2×2表只
比较玩家1/2的两个端点，固定其他人，不冒充完整多人策略空间。实际点击
导出完整参数、约定、结果及零/全贡献对照；页面不访问私有手记或网络服务。
错误参数保留旧显示并暂停导出，重置可恢复。

## 接入学习生态，而非再建孤岛

原创 AI 辅助笔记核对 oTree 固定教程的共享返还机制，独立推导个人变化
`m/n−1` 与总和变化 `m−1`，列出两种等号和分配反例。明确没有运行 oTree、
真实玩家、金钱、现实合作率或政策预测。完整许可保留其额外实验发表引用
约定，见[资源与隐私记录](iteration-19-compliance.md)。

新路线追加两个手动自解释题，现有八条路线 / 二十个永久问题；原十八个ID
不变。十二篇公开笔记、十三条有理由的阅读关系、四十五项公开搜索元数据
连接已有实验。真实浏览器验证旧十八步原始备份打开不重写，显式追加新题
后导出仍保留旧值，不通过访问推断完成。

文章末尾保留原返回入口，新增“查看这篇的阅读联系”。无 JS 时用真实SSR
行锚点定位，增强时选择并聚焦当前知识邻域。共享文章头的搜索图标从受旧
SVG样式污染的34px/24px顶边距恢复20px/零边距，标签从两行恢复单行。

## 截图和验证

初版截图发现手机端玩家1反馈离滑条过远、标题和范围说明占据过多开头空间。
已把反馈移到同一贡献面板、紧跟滑条，收起次要规则和其他玩家控件；完整
账本、定义与来源仍保留。桌面用一块轻玻璃操作面与无框收益分解，手机
按同一DOM顺序排布；无空闲动画引擎、无新增依赖。

| 验证 | 实际结果 |
| --- | --- |
| `npm run build`、`npm test` | 通过 |
| `npm run test:atlas` | 98 项通过；新增7项含独立穷举最佳回应/总和优化 |
| `bash tools/test.sh`（Ruby容器） | 31 案例 / 182 断言；54 HTML / 303 内部链接通过 |
| 两种 baseurl 构建、HTMLProofer、artifact guard | 通过；根路径与 `/Brook-ZzQq.github.io` |
| 完整 `test:atlas:browser` | 全部通过，包括旧地图、Python入口、搜索、观察台、评测、空间留出、练习与三个新套件 |
| 新实验与Knowledge，两种路径 | 390/768/1440 × 深浅主题、均衡等号、8人、实际下载、拒绝错误、隐私、键盘、axe、减少动画、320px/短屏/200% DOM字号与无JS通过 |
| `test:atlas:python` | 实际Pyodide三例、空均值保护、异常、输出上限、死循环超时、重载、停止通过 |
| Hallmark 静态CSS+真实URL render | 5张实际截图；0 FAIL / 0 REFLEX / 0 WARN |

独立 fresh-context finish review 曾启动，但在最终结论前遇到使用额度限制。
未把中断冒写为独立通过；按工具不可用降级流程，在当前线程读取检查表、
重看实际桌面/手机截图并核查边界，记录 **in-thread，0 material findings**。
这是独立复核尚未完成的明确限制，原始状态见[复核记录](iteration-19/finish-review.txt)。

原始记录：[构建](iteration-19/build-results.txt)、[浏览器](iteration-19/browser-results.txt)、
[Hallmark](iteration-19/hallmark-results.txt)。
截图：[初版手机](iteration-19/screenshots/first-390-dark.png)、
[修正手机](iteration-19/screenshots/final-390-dark.png)、
[桌面](iteration-19/screenshots/final-1440-dark.png)、
[等号/浅色](iteration-19/screenshots/equality-1440-light.png)、
[搜索控件改前](iteration-19/screenshots/header-before-1440.png)、
[改后](iteration-19/screenshots/header-after-1440.png)。

Safari、Firefox、真实手机和OS输入法未验证；DOM字号放大不替代全部浏览器
缩放测试。没有把元数据采集成功当作新闻已核对，也不为学习者评分。

## 预览

下载最新PR的成功CI产物 `atlas-review-preview`，从包含项目文件夹的目录
启动 `python3 -m http.server 8000`，打开
`http://127.0.0.1:8000/Brook-ZzQq.github.io/playground/public-goods/`。
完整步骤见 [PREVIEW.md](PREVIEW.md)；源码 ZIP 不能由 Python 编译为网页。
没有变动生产配置、Pages来源、默认分支或自动发布。后续五小时新请求单独
记录实际起点和工作范围，不把线程中断时间计为持续开发。
