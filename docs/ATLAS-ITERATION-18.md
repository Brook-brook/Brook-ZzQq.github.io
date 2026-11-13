# 第十八轮：每条学习连接，都给一个理由

基于已推送、未合并的第十七轮 `950a02c`，分支
`feat/atlas-iteration-18`。这是持续三小时迭代的第二段；本报告只记录本段
实际工作，不把它当作整个时长任务已结束。第十七轮云端 CI 已实际通过。

## 学习生态的实际改变

`/knowledge/` 可以选择任一公开笔记，按准备基础、延伸理解、对照边界查看
明确编排的联系和理由，并打开真实笔记、对应实验及原学习路线的自解释题。
当前十一篇笔记、十二条关系；这些是披露 AI 辅助的阅读建议，不是自动语义
关系、强制先修或掌握程度。C++ 暂未编排跨笔记联系，保留诚实空状态和
两道实际练习，不强造一条连线。

新控制器不读/写学习或观察台 key，不记录访问/完成；只在显式选篇时替换
公共笔记 fragment 并保留 history.state。原笔记目录、类别/文字筛选及其
既有 URL 行为保持，另补上可用的重置入口；不与全站无历史搜索混为一谈。

完整十二条联系、理由和全部笔记不依赖 JavaScript。元数据无法校验时保留
完整原生目录；标题与说明按文字渲染，拒绝危险链接。减少动画偏好变化会
取消仅由明确选择触发的 320ms / 4px 轻反馈，没有空闲动画引擎。

## 真实构建先挡住私有内容

新增生成/验证 hook 在公开笔记过滤和路线校验之后运行。只提取公开标题、
摘要、类别、真实实验和公开题目链接；不包含正文或浏览器记录。配置中的
缺失/私有端点、重复关系、错误类型、无界字段和危险 URL 使构建失败。

真实 Jekyll 新增四组测试：公开裁剪、--unpublished 仍不可绕过、错误字段
失败、正常降级后元数据/旧文件清理。当前为 **31 案例、182 断言**。
浏览器还用合成私有标记验证没有读取、写入或上传个人 key。

## 截图确实改变了实施

旧 390px 截图中，基础图标签实际只剩 **6.7px**，三个实验链接也紧贴在一起。
原五个 SVG 目的地全部保留；新原生横向滚动区让标签保持 **14px**，可键盘操作。

初版又暴露早期 Atlas 全局 header/article/details 的串扰：内层标题被横排，
页面间距虚高，深浅主题的搜索图标受到全局 SVG 规则影响。改用已有的 Universe
页面外壳，并给保留目录/示意图写局部样式，未更换框架或主题。

关闭的原生 disclosure 子内容明确退出布局，避免隐藏标题的虚拟尺寸影响
几何检查；打开时完整资料仍然可见。真实长题名最多两行，保留完整问题。
所有按钮/字段用既有圆角、字号、颜色和即时焦点 token。

## 设计复核与验证

Hallmark 实际执行新 CSS 静态检查及真实构建 URL render。初版：0 FAIL、
9 REFLEX、4 WARN；修正间距、材质、字重和旧样式串扰后，最终：
**0 FAIL、0 未处理 REFLEX、0 WARN、1 合理例外、1 Finish 说明**。
49b 例外保留完整真实题名两行，F4 说明中性按下态是筛选状态而非主 CTA。

独立 fresh-context 复核原结论 **fix**，只发现问句标题后重复句号；已保持
原题名、把数量状态另起一行。390/1440 实拍确认不再有“？。”，父线程标记
resolved；没有把原始 fix 写成 ship。详见
[复核原文](iteration-18/finish-review.txt)与[设计审查](design-audit-iteration-18.md)。

| 验证 | 实际结果 |
| --- | --- |
| `npm run build`、`npm test` | 通过；新增测试脚本的一处引号规范已由 lint 发现并修正 |
| `npm run test:atlas` | 91 项通过（新增 4 项关系/边界模型测试） |
| `bash tools/test.sh`（Ruby 容器） | 31 案例 / 182 断言，52 HTML / 276 内部链接通过 |
| 新 Knowledge 浏览器检查，两种路径 | 390/768/1440 深浅主题、方向/理由、空态恢复、真实入口、hash/返回/重载、14px 图、无 JS、隐私、错误数据、减少动画及小屏/短屏/字号通过 |
| 原整站回归与真实 Python | 全部通过；包括新 Knowledge 套件，以及实际 Pyodide 三例/错误/上限/超时/重载/停止 |

原始记录：[构建](iteration-18/build-results.txt)、[浏览器](iteration-18/browser-results.txt)、[Hallmark](iteration-18/hallmark-results.txt)。
截图：[改前手机](iteration-18/screenshots/before-390.png)、
[初版旧样式串扰](iteration-18/screenshots/first-1440-light.png)、
[修正后手机](iteration-18/screenshots/final-390-dark.png)、
[修正后桌面](iteration-18/screenshots/final-1440.png)、
[复核文案修正](iteration-18/screenshots/resolved-cpp-390.png)。

Safari/Firefox、真实手机/OS 输入法未验证；DOM 200% 字号检查不是浏览器实际
缩放的完整替代。此页面也不重新核查新闻、推断权威结论或给学习者自动评分。

## 预览与下一步

下载本 PR 最新 CI 的 `atlas-review-preview`，按 [PREVIEW.md](PREVIEW.md)
解压启动 HTTP 服务后，打开 `/Brook-ZzQq.github.io/knowledge/`。未自动合并、
部署、修改 Pages 或默认分支。下一段继续补一个严谨的公共物品实验，把个人
最佳回应、群体收益目标和参数边界接回已有知识与学习路线。
