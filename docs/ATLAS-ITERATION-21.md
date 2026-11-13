# 第二十一轮：让循环能够停，也能够解释为什么停

从第二十轮已推送的 `8d68747` 创建 `feat/atlas-iteration-21`，PR依次审查，
不把未合并分支称为线上发布。继续用户五小时AI/Agent学习生态任务；
本报告只记录已做的功能与证据，不将等待或旧中断时间虚报为开发时长。

## 可以操作的运行边界

新增 `/playground/agent-runtime/`。每次显式点击只推进一个阶段：脚本
提议、整批校验、真实本机派发、带运行/调用ID的回执。观察进入本次
公开上下文后才影响下一提议；最终说明仍标为固定模板，不是模型思考。

六种情景包含先查两座图书馆再计算、一次提议的两个调用、一次明确
模拟失败再重试、重复且没有进展、旧运行回执、未开放工具。提议数与
派发次数有独立预算；一次批量派发可以只完成一部分。停止与预算耗尽
均保留已发生的工作，不伪装完成或撤销。

实际计算复用现有三个只读GIS函数和六点目录。正常情景需要3次提议、
2次派发，球面代表点距离约1020.2m；不变更来源核对日、坐标或覆盖声明。
整次公开源/设置快照属于该运行，结果可完整下载和离线重放。编辑设置
保留旧证据，须显式重新应用，阻止过期执行与导出。

原Tool Calling参数编辑实验继续保留。新实验连接已有循环/轨迹两道
练习，不增加/改名二十八个永久ID，不新建手记或自动学习记录。当前
十路线、十七公开笔记、二十一阅读联系、五十四公开搜索元数据。

## 从教具走向自己的代码

新增原创 `assets/examples/agent_loop.py` 和实际公开目录JSON下载。
由读者在自己的本地/服务端配置模型与Key，网页没有Key字段或模型服务。
该例子使用实际固定SDK3.50.0，处理完整调用批次、调用关联、必要响应
上下文、独立请求/派发预算、拒绝/不足/错误与未完成的部分工作。

只允许三个直接、同步的本机只读函数。严格检查重复JSON键、未知工具/
地点、非有限数字、额外字段、重复调用ID和不支持调用形式。模型文字
结果保留 `answer_fact_checked: false`，不因返回文本而认证任务正确。
最小轨迹不含原问题或隐藏推理；没有远程tracing、任意URL或shell工具。

实际验证使用真实SDK的序列化/类型/异常与完全内存假HTTP传输，十五项
通过，包括命令行实际下载脚本的连接和配置/文件大小错误。没有调用
真实模型、读取账户凭据、花费API费用或声称模型任务能力已验证。
来源/许可和详细数据边界见 [本轮审查](iteration-21-compliance.md)。

## 看截图之后作出的修正

初版桌面首屏计数先于动作，1280×800看不到开始按钮。已把当前动作
移到辅助计数之前、缩短开头、统一参数行，并增加实际按钮坐标断言。
手机反馈紧跟动作，实际证据另有原生跳转入口。支持无JS规则/来源、
键盘、浅色/深色、减少动画与320px/短屏/DOM字号检查。

Hallmark第一次发现错误提示侧边装饰条，随后发现过长文字measure；
两者已修正。最终CSS与真实URL检查0 FAIL / 0 REFLEX / 0 WARN，五张
规定截图。独立finish review：**fix，一项发现，修正后自评分resolved**。
详见 [设计审计](design-audit-iteration-21.md)。

| 检查 | 实际结果 |
| --- | --- |
| `npm run build`、`npm test` | 通过 |
| `npm run test:atlas` | 114项通过，新增15项运行模型检查 |
| 固定venv `python tests/agent-loop-offline.py` | 15项通过，实际SDK、假传输 |
| 原请求例子离线测试 | 10项通过，实际SDK、假传输 |
| 容器 `bash tools/test.sh` | 32案例 / 186断言；61 HTML / 370内部链接通过 |
| 根路径构建、HTMLProofer、artifact guard | 通过 |
| 循环实验实际浏览器 | 六情景、部分导出、原生下载、双主题/3尺寸、axe、键盘、无JS、坏数据、隐私通过 |
| 根路径循环、AI路线与Knowledge浏览器 | 通过；另对最终手机跳转修正重跑根路径循环套件 |
| 完整 `npm run test:atlas:browser` | 21套件全部通过，最后套件包含最终证据跳转修正 |
| `npm run test:atlas:python` | 实际三例、空均值、异常、输出上限、死循环超时、重载与停止通过 |

Safari、Firefox、真实手机与OS输入法仍未验证；此前官方下载被环境403
阻止，没有绕过限制。200%DOM字号不是完整浏览器缩放测试。固定脚本
行为、离线SDK契约与真实模型能力是不同的验证范围。

## 主要文件与预览

页面在 `playground/agent-runtime/index.html`；纯模型与控制器在
`assets/js/atlas/runtime-models.js`、`agent-runtime.js`；局部样式在
`assets/css/agent-runtime.css`；Python例子与公开目录在assets对应目录。
两篇既有Agent笔记、路线/搜索/实验目录与真实项目状态同步更新。

截图：[初版桌面](iteration-21/screenshots/before-1440-dark.png)、
[修正桌面](iteration-21/screenshots/after-1440-dark.png)、
[手机部分完成](iteration-21/screenshots/partial-390-light.png)、
[手机执行后证据入口](iteration-21/screenshots/evidence-jump-375.png)。
原始记录：[构建/模型](iteration-21/build-results.txt)、
[浏览器](iteration-21/browser-results.txt)、[Hallmark](iteration-21/hallmark-results.txt)、
[独立审查与修正](iteration-21/finish-review.txt)。

下载本PR成功CI的 `atlas-review-preview`，从包含项目文件夹的目录运行
HTTP服务器，打开
`http://127.0.0.1:8000/Brook-ZzQq.github.io/playground/agent-runtime/`。
详见 [PREVIEW.md](PREVIEW.md)。源码ZIP不能由Python静态服务编译。
不修改生产配置/Pages来源，不自动合并或部署。
