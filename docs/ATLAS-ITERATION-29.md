# 第二十九轮：先读懂数据，再搭能核对的Agent

基于实际已推送、未合并的28/5f29128，分支`feat/atlas-iteration-29`。
保留原有紫色学习花园、地图、实验、两条AI/Agent主路线和SDK/MCP项目，
补上从数据接口到动作恢复之间可以独立运行的基础。

## 本轮能直接使用什么

| 材料 | 可以做什么 | 实际范围 |
| --- | --- | --- |
| JSON能解析，还缺哪一步？ | 在Python Playground第五例改true、1和"1"，核对解析/类型/应用契约 | 真实Pyodide，需显式加载和运行；与ZIP共享原创源码 |
| 先把一次HTTP看清楚 | 跑11个GET情景，分开传输、状态、表示与计算 | 标准库真实loopback HTTP；没有公开API或模型 |
| 超时后，再发一次？ | 操作新回执实验，比较未知、普通重发、幂等/参数冲突、新key和历史回执 | 浏览器真实JS内存；配套项目另实际跑6种POST/查询情景 |
| 重启之后，回执还在吗？ | 让子进程在COMMIT前/后退出，新进程重开同一临时SQLite文件 | 标准库真实进程与文件，不是网页服务或完整Agent checkpoint |
| 一次实际恢复记录JSON | 不先安装也能读完整参数、回执和独立观察，追溯ZIP/生成器版本 | 实际重放当前ZIP保存的公开教学证据，不是预写模型结果 |

API基础包为15-entry、24629字节，20项标准库检查，另有4个JSON、11个GET
及6个POST/查询CLI案例。独立恢复包为9-entry、17901字节，8项检查及6个
进程情景。两者不需pip、模型Key或第三方SDK；恢复包需Python自带sqlite3。

恢复记录实际生成UTC为`2026-11-15T14:04:15Z`。故障配置`injected_steps`、
客户端实际收到的`client_trace`、独立新进程读到的`teaching_observer`
分别保留。缺回执仍为null，旧回执仍描述历史值；实际版本和源哈希随记录
保存。CI会重放标准库CLI比对语义结果，允许声明的运行版本不同。

现在共有28篇公开笔记、14条路线/44道手动自检、46条编排联系和71条公开
搜索元数据。新增两条可选基础路线、六个永久ID只追加在原38项之后。
旧记录原始字节与导出在路线/练习两页保持，只有显式填写/勾选才扩展。
没有新存储、隐式完成、打分、先修解锁或私人搜索索引。

原四个学习ZIP保持字节不变，原三段SDK/直接工具/MCP/宿主练习继续可用。
新文章从模型请求、Agent循环和搭建文章接入；知识联系、AI入口、首页
构建记录、Playground和搜索同步链接实际存在的资源。HTTP/SQLite阅读
文章没有伪造浏览器实验按钮。

## 界面与交互的实际修正

新回执页用一个轻玻璃操作区和未包卡的教学透视，区分客户端状态与实际
计数/应用次数/缓存回执。主操作使用成对淡紫色与深色文字token；查询、
重置和下载维持次级。操作有有限220ms反馈，减少动画偏好改变时可取消。
没有网络延迟动画、闲置循环、新模糊层、字体或动效库。

第一版390px截图暴露通用dl网格挤压说明，通用header/label空白也把发送
操作推到短桌面首屏外。已用局部重置和设置区布局修正；正常手机两列，
359px以下一列，维持原字号/48px控件。手机可用原生“查看演练透视”和
“回到发送区”往返并移动键盘焦点。

更换首回故障或保留下一次参数后，初始提示不再固定描述默认加2/丢回执。
拒绝无效草稿时也隐藏上次匹配提示，实际已发生的结果与导出仍保留。
导出只包含执行过的步骤，不把未发送的选项当成已执行。

独立Hallmark终审的原始结论为`fix`、1项：375px标题把“回执”拆开。
按同一次修正批次增加可选显示用title_keep，保护短术语，保持普通标题
元数据和搜索文字。320/375/390px、两主题、根字号16/32px实测术语不拆行，
无整页横向溢出；未缩小字。修正页5张Hallmark复核图仍为0 FAIL/REFLEX/WARN。
这是一项父线程实测评分的resolved；没有把原始fix改写成复核者零发现ship。

最终逐行阅读也把提交前退出那行明确为“值0、效果0”，避免“没有已提交值”
让人误解初始化没有记录。实际已提交的初始值是0；缺少的是本次增量。
这处正文修订另在根/项目路径实际重建、复核文章与下载，并重新截取五图；
先前完整31套覆盖的是共享标题修正后的代码，未将它说成后续逐字重跑。

初轮七个URL35张渲染检查均干净，复核者实际检查全部图片与六份真实
before/初版输入，并在隔离Chromium验证关键回执状态、导出、焦点和
Python预选无自动解释器请求。新SQLite文章此前不存在，不伪造旧版截图。

## 实际验证

| 检查 | 结果与范围 |
| --- | --- |
| npm run build、npm test | 通过；JS与项目既有SCSS检查，未宣称全站CSS无历史债 |
| 新delivery.css Stylelint | 通过；原始格式失败与修正记录保留 |
| npm run test:atlas | 148项通过，包括实际解压运行两种标准库项目及保存证据比对 |
| API包 | 20项标准库检查、4 JSON/11 GET/6 POST实际通过；包含阻塞超时、断开、并发同key和应用后坏回执 |
| SQLite包 | 8项检查/6 CLI实际通过；提交前后退出、回执再丢失、提交后异常、独立观察、文件不覆盖与坏状态不修复 |
| 相同ZIP的3.11复核 | UID10001、禁外网、只读根、无site导入；API与SQLite实际运行通过，SQLite语义记录跨版本一致 |
| Jekyll发布边界 | 43案例/238断言通过，修正后的共用模板也再次完成既有检查 |
| 根/项目路径构建与产物 | 两种实际Jekyll构建和Pages产物guard通过，无原始frontmatter/Liquid、缺资产或Python缓存 |
| 最终内链 | 按项目既有localhost例外配置，每路径74 HTML/530内链通过 |
| 整站浏览器 | 初轮31套全部通过；标题修正后的完整31套再次通过，实际Chromium，无控制台/布局/交互回归发现 |
| 根路径浏览器 | 主15页双主题/三宽度，API/回执/恢复/AI/搜索/知识图及真实Python5例均通过 |
| 修正后的恢复文章 | 两路径双主题390/768/1440，实际ZIP/JSON下载、axe、无JS320原生方向键表格、两倍正文和标题术语检查通过 |
| 实际解释器 | 两路径真实Pyodide五例、编辑后计算、异步释放/取消、异常、输出上限、5秒超时、停止/重载通过 |
| 设计检查 | 七URL35初轮截图干净；一次独立终审fix1，实测修正/复核5图0问题 |

本机为CPython3.12.14/SQLite3.53.1；相同ZIP容器为CPython3.11.18/
SQLite3.46.1。真实loopback交互、浏览器JS内存、实际Python执行、原生
阅读/下载与保存记录分别验证，互不冒充模型、服务认证或断电保证。

## 已知问题与没有覆盖的范围

额外将整个旧atlas.css送入Hallmark源扫描，得到21 FAIL/62 REFLEX/4 WARN。
该文件与28/5f29128逐字节相同，同旧CSS+旧Python页面得到相同诊断；原355项
全文件Stylelint债未在此轮重排。新增组件/所改页面的范围检查和这些旧源
问题分开记录，不能据此宣称整个旧样式表干净。

独立HTMLProofer最初漏传项目既有localhost演示链接例外，报出旧博文两条
非HTTPS本机URL。按tools/test.sh同一配置复核后，两路径通过；没有改写
原博文或把错误命令当作生产页面缺陷。源码包生成也曾误用位置参数api，
已改成明确的--profile api；清单在源码变化后按实际程序重新生成。

最后新建的Docker预览快照曾复制出宿主不可读的atlas.css，产物检查报
EACCES，浏览器/设计检查看到了缺样式回退。这批结果未获接受。只在
构建容器内为自有预览目录补a+rX，重新检查资源与文章；原始失败随证据
保留，没有改生产权限、依赖、源码样式或绕过失败检测。

sqlite.org事务/版权网页返回403，未声称读取或绕过；实际阅读固定CPython
文档、SQLite源码pager背景与完整许可说明。没有复制上游实现或将整份
RFC/SQLite仓库一概称为MIT/public domain。

Safari/Firefox、实体机、OS输入法、完整浏览器缩放、机器掉电、磁盘/网络
文件系统故障未验证。DOM字体重排不是完整浏览器缩放。示例只在一个
数据库事务内保存计数和回执，不自动恢复模型消息、预算、授权或外部动作。

## 文件、记录与预览

主要文件：四篇_atlas_notes基础教程；_includes/api-foundations与agent-restart；
Python原生预选/模板；新delivery HTML/JS/CSS；AI入口、学习路线/提示、
知识联系、搜索；显式打包器/生成器、完整许可和对应模型/浏览器检查。
文档、AGENTS、预览说明和当前统计同步更新。

[预审/实际审计](design-audit-iteration-29.md)、
[API来源](api-foundations-source-review.md)、[SQLite来源](sqlite-recovery-source-review.md)、
[合规记录](iteration-29-compliance.md)、[学习导览](AGENT-LEARNING-GUIDE.md)。
原始构建、浏览器、CLI、设计与终审材料见[证据目录](iteration-29/README.md)。
含[构建记录](iteration-29/build-results.txt)、[浏览器记录](iteration-29/browser-results.txt)、
[实际运行](iteration-29/runtime-results.txt)、[Hallmark范围](iteration-29/hallmark-results.txt)、
[原始fix与实测修正](iteration-29/finish-review.txt)；旧CSS债另列。

| 真实截图 | 修改前 / 初版 | 本轮结果 |
| --- | --- | --- |
| AI入口，390px | [原28入口](iteration-29/screenshots/before-ai-390.png) | [四项基础补给](iteration-29/screenshots/after-ai-390.png) |
| AI入口，1440px | [原28入口](iteration-29/screenshots/before-ai-1440.png) | [本轮入口](iteration-29/screenshots/after-ai-1440.png) |
| Python，390px | [原四例](iteration-29/screenshots/before-python-390.png) | [第五例原生预选](iteration-29/screenshots/after-python-390.png) |
| 回执实验，390px | [初版说明挤压](iteration-29/screenshots/first-delivery-narrow-rules-390.png) | [初始](iteration-29/screenshots/after-delivery-initial-390.png) / [实际首回丢失](iteration-29/screenshots/after-delivery-unknown-390.png) |
| 回执实验，桌面 | [初版短首屏](iteration-29/screenshots/first-delivery-short-desktop.png) | [1440px状态](iteration-29/screenshots/after-delivery-unknown-1440.png) |
| 恢复文章，375px浅色 | [终审发现断词](iteration-29/screenshots/before-recovery-heading-375-light.png) | [保持回执同一行](iteration-29/screenshots/after-recovery-heading-375-light.png) |

新回执页没有原28版对应页面，上表初版是本轮真实中间状态；桌面初版为
短视口，最终1440图用于状态/布局阅读，不声称两图视口相同。短视口修正
另由浏览器断言核对。所有截图仅为隔离上下文中的公开页面/合成状态。

从对应PR最新成功CI下载atlas-review-preview，在包含Brook-ZzQq.github.io
文件夹的那层按[PREVIEW.md](PREVIEW.md)启动http.server，然后打开：

```text
http://127.0.0.1:8000/Brook-ZzQq.github.io/study/ai/#api-foundations
http://127.0.0.1:8000/Brook-ZzQq.github.io/playground/python/#json-contracts
http://127.0.0.1:8000/Brook-ZzQq.github.io/playground/delivery/
http://127.0.0.1:8000/Brook-ZzQq.github.io/knowledge/agent-state-recovery/
```

源码ZIP、编译预览、Python项目ZIP和公开运行JSON各有不同用途。普通
http.server不会编译Jekyll或运行这些Python项目；网页也不会替你启动进程。
没有更改Pages来源、生产工作流或默认分支，没有自动合并/部署。线上
不会因开发PR更新；CI结果与可用预览以PR最新提交的Checks为准。

下一轮最有用的材料是一份愿意公开的小任务及输入/失败/验收样例，帮助
判断基础路线是否能走通；不自动收集学习手记，也不以访问推断掌握程度。
