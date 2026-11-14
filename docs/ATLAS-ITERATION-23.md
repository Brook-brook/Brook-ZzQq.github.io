# 第二十三轮：读完一篇，找到自己的下一个问题

基于已推送的第二十二轮`13b5ad0`，开发分支`feat/atlas-iteration-23`。
没有假定前面PR已合并。本轮延续AI/Agent学习任务，完成文章到练习的最后
一段连接、接口辨析和能下载操作的小任务材料。公开身份仍为Brook。

## 这一段学习生态已经能做什么

第二十轮增加两条开放路线、八道手动自解释问题和五篇原创建议式基础课；
第二十一轮让循环与停止真实可操作，第二十二轮补上检索和完整证据。
最新分支包含这些代码。顺序不是门禁，阅读与点击从不代表掌握。

| 想弄清的问题 | 正文与实际操作 |
| --- | --- |
| 模型、程序和资料各负责什么 | AI应用基础；下载五案例设计卡，先运行确定工具 |
| 完成、拒绝和不完整怎样区分 | 请求契约；可下载本地Python客户端 |
| JSON和schema正确是否足够 | 同篇输出契约；真实工具参数/类型校验 |
| 怎么证明一次改动有用 | Agent评测；基线、失败例和保留测试；合成分类实验练分母 |
| 谁决定下一步、什么时候停 | Agent循环；逐步提议、整批校验、实际派发、回执与预算 |
| 找到片段是否已经有证据 | RAG原理；虚构手册的字面检索、版本、标注与完整上下文 |
| 工具结果中的指令能否改权限 | 同篇循环文章的数据边界；未开放工具与错配回执 |
| 运行结束与任务做对差在哪 | Agent评测；实际公开事件导出和未完成状态 |

所有二十八个永久题目ID、十条路线、原v1手记和已有实验保留。本轮无新
存储键、自动评分、访问记录、私有索引或新框架。当前十八公开笔记、
二十三条明确编排的阅读联系、五十六项公开搜索元数据。

## 本轮具体改动

文章目录现在可以直接到“本篇自解释问题”。第一道问题和原路线仍直接
可见，原生展开区列出同篇其他问题的真实标题、重点与实验。读者不必
回路线猜同一篇文章为何出现两次；未映射的笔记没有虚构练习。

新增`/knowledge/skills-mcp-boundaries/`，用同一个只读校园任务区分Tool
Calling、Skill工作指引、MCP上下文协议和Agent运行时。按真实固定版本
解释宿主/客户端/服务端、渐进加载、授权与控制流。没有将原生函数包装
冒称MCP实现，或把allowed-tools当成通用授权。

两个可以实际下载的原创材料：

- `SKILL.md`格式示例：完整前置条件、步骤、边界和验收；下载保留YAML
  frontmatter，网站与Python客户端没有自动安装/激活它。
- `ai-task-card.md`：真实公开快照上的五个JSON输入，分别是两点距离、
  同ID、未收录ID、错误类型、空匹配，随后留白设计自己的小任务。不是
  模型成绩或学习者答案，也不需要API账号才能使用前五项。

真实手机截图发现旧Rouge块受通用表格/多层pre样式影响，代码被多重边框
和内边距挤压。现在只有一个代码表面和具名键盘滚动组，把布局表移出
pre/code，保留完整代码、行号与语法颜色；普通数据表不受影响。新展开和按压尊重减少动画偏好。

走读还修正基础/请求文章两处“工具实验”正文链接：现在直接打开可编辑
工具页。图书馆正常/零距、非法ID/类型、食堂空匹配五项都从实际下载卡
贴入真实浏览器执行或拒绝，结果和完整JSON导出相符。Chromium移动模拟
中的真实touch-swipe也能横向滚动完整循环图；这不代表实体手机验证。

## 来源与审查

实际阅读固定AgentSkills `83021e2`的完整格式规范与两份许可，MCP
`06e9234`的架构相关范围、完整2026-07-28 Tools规范与完整实际LICENSE。
原中文笔记和例子独立编写，未复制上游代码、图、消息或语料。

MCP README的MIT摘要与实际复合许可不同，保留Apache2/MIT迁移和CC-BY4
文档说明，不把它整体误标为MIT。AgentSkills代码Apache2、文档CC-BY4；
完整文本保留在licenses，并更新开源致谢。详见
[来源审查](interface-literacy-source-review.md)和
[本轮compliance](iteration-23-compliance.md)。

Hallmark对两条真实文章URL各完成规定五幅截图。初版发现缺少active反馈，
已修正；最终分别0 FAIL / 0 REFLEX / 0 WARN。按gates§6完成一次独立新上下文
finish review，结论ship，零问题。详情见
[设计审计](design-audit-iteration-23.md)、
[原始审查](iteration-23/finish-review.txt)。

## 实际验证

| 命令或检查 | 结果 |
| --- | --- |
| `npm run build`、`npm test` | 通过 |
| `npm run test:atlas` | 126项通过 |
| 容器`bash tools/test.sh` | 37案例 / 222断言；63 HTML / 389内链通过 |
| 根路径独立构建、HTMLProofer、artifact guard | 通过；最终两处正文链接与Skill下载再次实际检查 |
| 新文章浏览器 | 八篇×390/768/1440×两主题；真实展开/焦点、代码、下载、v1原raw、隐私、axe与无JS通过 |
| Python/JS数值与字面契约对照 | 四项测试，138个有效调用通过；明确合成资料及1e-6m数值容差 |
| 新卡片实际操作 | 下载文件中的五个输入逐个执行/拒绝，完整真实JSON导出通过；未调用模型 |
| 整站23浏览器套件 | 按记录恢复运行后全部通过；最终代码容器另跑八篇专项检查 |
| 真实Pyodide | 三例、空均值、异常、输出上限、死循环超时、重载与停止通过 |

浏览器回归先受环境重启中断，随后发现地图旧测试的固定30ms等待和
Knowledge旧计数21。已用真实媒体变化事件同步地图断言，并把明确新增
关系检查补齐；地图实现未变。最终顺序恢复运行，不将失败/中断的一次
称作全过，PR的CI会从头完整执行。

首次根构建误与资产生成并行，导致临时缺bundle；最终先资产后Jekyll，
重新生成隔离根路径产物并核对。代码语义修正时axe还指出重复region地标，已改为具名group而非
关闭landmark-unique。没有关闭proofer、axe或动画取消断言。

Safari、Firefox、真实手机、OS输入法、完整浏览器缩放、真实模型与MCP
互通未验证。SDK例子此前测试使用真实固定SDK配内存假HTTP，不能称为
模型推理或真实服务可用性测试。浏览器手记只用新上下文合成夹具验证，
没有读写用户的真实浏览器资料。

## 文件与预览

主要文件为新接口笔记、`_includes/note-learning-paths.html`、
`_includes/note-code.html`、`assets/css/note-practice.css`、两个公开下载、
既有路线引用/联系，以及真实Jekyll/浏览器/跨语言契约测试。

截图：[旧页底手机](iteration-23/screenshots/before-loop-390.png)、
[改后手机浅色](iteration-23/screenshots/choices-390-light.png)、
[改后桌面](iteration-23/screenshots/choices-1440-dark.png)、
[初版嵌套代码](iteration-23/screenshots/code-before-390.png)、
[修正代码](iteration-23/screenshots/code-after-390-dark.png)。
原始记录：[构建](iteration-23/build-results.txt)、
[浏览器](iteration-23/browser-results.txt)、
[Hallmark](iteration-23/hallmark-results.txt)、
[任务卡操作](iteration-23/task-card-browser.txt)。

从最新成功CI下载`atlas-review-preview`，解压后在包含项目文件夹的那层
运行`python3 -m http.server 8000`，打开：

```text
http://127.0.0.1:8000/Brook-ZzQq.github.io/study/ai/
http://127.0.0.1:8000/Brook-ZzQq.github.io/knowledge/skills-mcp-boundaries/
```

完整方法见[PREVIEW.md](PREVIEW.md)。源码ZIP不是已编译预览。不修改Pages
来源、生产工作流或默认分支；不合并、不部署。

下一轮优先请真实读者尝试一条路径，反馈哪里题意不清、参数难改或证据
难核对；按实际问题修订教材与操作，而不继续增加自动学习指标。
