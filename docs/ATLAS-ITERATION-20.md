# 第二十轮：从一次请求，开始 AI / Agent 开发

基于已推送、未合并的第十九轮 `8dc7313`，分支 `feat/atlas-iteration-20`。
这段响应用户新增的五小时迭代与AI/Agent基础路径要求；持续时间与后续阶段
单独记录，不把旧线程中断时间或尚未完成的时段算成已完成开发。

## 能够直接使用的学习路径

新 `/study/ai/` 入口有两条开放路线、八个手动自解释问题，连接五篇原创、
披露AI辅助且有固定官方来源的中文笔记：

1. 模型、应用、token、上下文与训练/推理。
2. 请求/输出契约、完成/拒绝/不足、错误、超时和结构化格式。
3. 模型控制、真实工具、观察与有预算的Agent循环。
4. RAG检索、版本、片段、引用和不足时的证据边界。
5. 任务验收、失败用例、轨迹定位、基线与评测。

每步有自己的学习重点、真实阅读/实验入口和练习问题；重复使用一篇文章
时也说明不同角度。Study、AI Lab与全站公开搜索均能到达新入口，支持
“Agent开发”“智能体开发”“检索增强生成”等明确关键词。没有虚构模型
能力、自动先修、评分、访问记录或掌握程度。

当前十条路线 / 二十八个永久问题、十七篇公开笔记、二十一条有理由的
阅读关系、五十三项公开搜索元数据。八个新ID追加在旧二十个之后，继续
使用同一v1手记；真实浏览器核对旧原始备份打开不重写、继续到第一个新题、
显式写入/勾选与下载仍保留旧值，未访问的新题不会生成自动记录。

## 真正开发之前，也要知道什么没有发生

原工具实验确实执行本机GIS函数，分类评测确实计算合成数据。它们没有
调用LLM，也不被这份课程包装成真实Agent服务或RAG系统。

新增可下载 `assets/examples/ai_request.py`，在读者自己的本地/服务端配置
模型后使用。网站不收集Key、不发送付费模型请求、不启用远程tracing。
实际安装固定 `openai==3.50.0` 于ignored测试环境，使用其真实序列化、类型
和异常，配合完全内存的假HTTP传输。十项离线测试覆盖正常文本、reasoning
元数据、拒绝/不足/空/意外工具项、坏信封、非法输入、401/429/500、连接/
读取超时与缺配置；没有冒称实测真实模型或其schema生成能力。

官方资料的真实阅读范围、纠正的简化说法与许可见
[来源审查](ai-foundations-source-review.md)和[资源/隐私记录](iteration-20-compliance.md)。
没有新增网站运行时依赖、地图点、框架或锁文件变动。

## 截图与真实验证

手机初版重复摘要、开头较长；已改为逐步重点和紧凑的本机起点。平板/桌面
还查出共享页眉可见文字与读屏名称不一致，改用原生链接名称后通过默认axe。
没有通过关闭规则、只看代码或把隐藏DOM尺寸当作视觉验收。

Hallmark真实URL与CSS检查最终0 FAIL / 0 REFLEX / 0 WARN，五张规定截图。
独立finish review结论 **ship，0 material findings**；报告中关于“固定栏”
的一处描述已按实测static定位纠正，设计结论保持。详见
[设计审查](design-audit-iteration-20.md)与[复核原文](iteration-20/finish-review.txt)。

| 验证 | 实际结果 |
| --- | --- |
| `npm run build`、`npm test` | 通过 |
| `npm run test:atlas` | 99项通过，含新产物缓存防护 |
| `python tests/ai-request-offline.py`（固定SDK venv） | 10项通过，全部为假传输 |
| `bash tools/test.sh`（Ruby容器） | 32案例 / 186断言；60 HTML / 363内部链接通过 |
| 根路径构建、HTMLProofer、artifact guard | 通过 |
| 新AI路径与Knowledge根路径浏览器 | 通过：6种尺寸/主题组合、实际入口/下载、原20备份、无JS、键盘、隐私、减少动画与小/短屏/DOM字号 |
| 完整 `test:atlas:browser` | 20套件全部通过，包含原地图、搜索、观察台、所有实验及新AI路径 |
| `test:atlas:python` | 实际Pyodide三例、空均值保护、异常、输出上限、死循环超时、重载和停止通过 |

完整回归曾发现两处随着内容增长而过时的预期：Python现在也匹配明确以
Python为起点的AI路线；原“无对照关系”的指标笔记现在已有一条新对照。
已按具体ID验证新结果，并另用确实没有该类型的笔记验证空态恢复，没有
把断言简单删掉或放宽成“至少一个”。最终状态以完成记录为准。

还发现本地测试导入Python例子产生的 `__pycache__` 被Jekyll复制到静态产物。
已禁止该测试生成字节码、补Git忽略，并让产物检查拒绝缓存/venv；用真实旧
产物确认会拒绝，再清洁构建并复验两种路径。不是把生成字节码当作公开教材。

原始记录：[构建/模型](iteration-20/build-results.txt)、
[浏览器](iteration-20/browser-results.txt)、[Hallmark](iteration-20/hallmark-results.txt)。
截图：[初版手机](iteration-20/screenshots/first-390-dark.png)、
[修正手机](iteration-20/screenshots/final-390-dark.png)、
[桌面](iteration-20/screenshots/final-1440-dark.png)、
[浅色文章](iteration-20/screenshots/agent-eval-390-light.png)。
Firefox官方下载尝试被环境403
阻止；Safari、Firefox、真实手机和OS输入法未验证。DOM200%字号检查不
等同于完整浏览器缩放验证。基础资料核对日不等于实时新闻时效。

## 预览

在本PR成功CI中下载 `atlas-review-preview`，按 [PREVIEW.md](PREVIEW.md)
从包含项目文件夹的目录启动HTTP，然后打开
`http://127.0.0.1:8000/Brook-ZzQq.github.io/study/ai/`。
不合并、不部署、不修改Pages来源或生产配置。后续将把循环和检索证据
接成可操作实验，仍然明确本地计算、脚本决策与真实推理的区别。
