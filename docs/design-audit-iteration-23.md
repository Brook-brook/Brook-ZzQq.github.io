# Iteration23 preflight — article-to-practice and interface literacy

Continue the latest pushed valid review branch after22, never assume a merge.
The growing AI path needs a distinction between an operation, a skill folder, a
context-exchange protocol and a runtime. It also needs a way to reach the other
real questions associated with an article, rather than only its first question.

- Keep all28 IDs, v1 manual records, existing paths/practice/Knowledge and labs.
  Native public article links/disclosures must never read a private store.
- Preserve the visible original route links and first practice destination. Add
  real alternate question titles/focuses and existing labs only when they exist.
  No artificial prerequisites, inferred recommendation, score or automatic visit.
- Original source-grounded Chinese Tool/Skill/MCP/runtime note: no server/client
  implemented claim, tool success does not imply task correctness. Pinned current
  source is MCP2026-07-28, not a guessed older initialize/session implementation.
- Actual sources read: AgentSkills83021e2be457a9b6679148719c1f6074f0ad975e
  README/specification/full code Apache2 and docs CC-BY4 license; MCP
  06e923405df3df242f1471b9300d9db90ebd10fd README, architecture participants/layers/
  discovery and tools specification, complete LICENSE. README says MIT but actual
  LICENSE describes a transition: Apache2 new/spec code, unconsented older MIT,
  non-spec docs CC-BY4. Preserve full actual text; never flatten to all-MIT.
- Skill is provisioned procedure/context and optional resources/scripts. Discovery,
  activation and resource loading are distinct; allowed-tools is experimental,
  not a universal permission guarantee. File name/installation does not grant
  capabilities. MCP host/client/server and model-provider tool envelopes differ.
- Optional original minimal skill example must download with real frontmatter,
  not be swallowed by Jekyll. Explicitly a format example, not an installed tool
  bundle or a feature the website/Python client auto-loads. No external commands.
- Locked lavender/soft glass, unboxed practice choices, native focus/details,
  no new animation library, palettes, fonts or persistence. Test source filtering,
  390/768/1440×themes, no-JS, keyboard, private raw backup unchanged, root/baseurl,
  downloads and real Hallmark captures/finish review before push.

## 实际页面问题与取舍

2026-11-14 Asia/Shanghai。在第二十二轮已推送代码基础上检查真实编译页，
保留紫色花园、Mote、两种主题与原有阅读宽度。本轮的主意是“一篇文章
可以通向不止第一道问题”，而不是再增加一套学习系统。

1. 原笔记页底部只能直接到本篇第一道问题。同篇两道题的不同侧重点被
   隐藏，读者还得回路线找。现在首题和原路线仍直接可见，第二个角度用
   原生details展开；每个标题、重点与实验来自现有校验过的公开路线。
   本文目录新增原生跳转，键盘焦点落到实际问题区；无匹配的新辨析笔记
   不生成假问题、实验或完成按钮。
2. 初版真实手机截图发现Rouge布局表、内外pre和通用数据表样式叠出多层
   边框与内边距，短例子也被挤掉。现在代码只有一个表面、一个可键盘
   滚动组；带行号的布局表移出pre/code，保留完整内容、语法颜色和可见
   行号，布局表仅对辅助技术标为presentation。普通资料表保留语义与原样式。
3. Skill片段的长description在手机上难读，改为合法YAML折叠文字。完整
   文件仍下载为SKILL.md，并由真实构建与下载检查保证frontmatter未丢失。
4. 按初学者走读，基础与请求文章中两处“工具实验”正文链接仍指向原理
   文章。已直接接到真实可编辑页，实际浏览器点击确认；原理仍可从知识
   库和路线访问。原始跳转前后日志一并保留。

Hallmark用于检查信息层级、实际材料和有意义的状态，不照抄参考主题。
没有重复卡片墙、渐变大标题、虚构活动计数、装饰粒子或新字体。页底问题
共用一块已有材质，内部用排版和分隔线区分；正文仍是阅读页面。

## Motion、移动端与门槛

新的问题入口只使用原生导航/展开与1px按压反馈；没有空闲循环动画、
鼠标跟随或JS私有状态。实时prefers-reduced-motion取消按压位移。390、
768、1440两主题都检查标题、展开、焦点和代码，额外检查320、短视口与
200%DOM字号；这不等同于实体手机或完整浏览器缩放测试。

最初sloplint报告REFLEX26b（新交互缺少active反馈），已补实际按压及减少
动画降级。最终对接口教程与Agent循环文章两条真实URL各完成指定五幅
渲染截图及CSS检查，分别为0 FAIL / 0 REFLEX / 0 WARN。没有静默忽略规则。
原始记录见[Hallmark日志](iteration-23/hallmark-results.txt)。

按既有Hallmark gates§6做了一次新上下文finish review：独立审查者读取
十张规定截图、展开/代码近景、旧页底对照、源文件与真实页面，结论ship，
无Floor或Reflex问题；没有需要第二次评分的Floor修正。
[原始审查](iteration-23/finish-review.txt)。审查后修正两处正文href，并把带行号代码的滚动容器从pre改为具名
block group，消除pre/code内嵌table的旧结构；没有新增视觉区域。重新
拍摄同十幅图并检查差异；四组关键截图像素差为零，见
[对照记录](iteration-23/semantic-visual-comparison.txt)。多个代码块最初用相同名称region，axe实际
指出landmark-unique，现用有名称且可聚焦的group避免制造重复地标，
规则保持启用。无行号的真实Rouge输出也保留合法pre/code并完成构建检查。

## 工程回归中实际发现的事项

- 地图套件在改变减少动画偏好后固定等待30ms，偶尔早于浏览器change
  事件。六组诊断确认事件后动画为零。测试改等真实事件和两个渲染帧，
  仍断言所有运行中动画为零；地图和动画实现没有改动。
- 公开阅读联系增加两条后，旧浏览器测试还写死21；更新为23并检查两条
  真实新关系和无虚构实验/题目。没有减弱数据或隐私断言。
- 首次根路径构建与资产生成错误并行，遇到bundle生成期间的缺失。后续
  明确先完成npm资产，再构建独立根路径产物，proofer与浏览器重新验证。
- 一次整站测试受环境重启中断；完成公共页套件后又遇到上述旧测试问题。
  最终日志按已通过的原套件顺序继续，没有将被中断或失败的一次称为
  全部通过。完整单次CI结果另在PR中核对。

后续优先观察真实学习反馈：题意是否明确、读者能否解释证据和停止状态。
不增加自动掌握分数或从访问行为推断能力。
