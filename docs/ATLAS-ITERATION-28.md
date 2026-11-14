# 第二十八轮：同一距离，三层证据

基于已推送、未合并27/eabd212，分支`feat/atlas-iteration-28`。这一轮
把已有搭建材料接到共同案例：直接调用、本机MCP和宿主桥接都返回同一
公开距离时，分别证明了什么。保留紫色阅读界面与已有功能。

## 可以直接使用的材料

新原创AI辅助教程`/knowledge/agent-interface-evidence/`实际重放此前三份
公开ZIP的默认CLI，选择同一`main-library`→`medical-library`子案例。
三者均返回1020.2255073099033米，原来源核对日仍为2026-11-02。这是
WGS84代表点之间、半径6371008.8米的球面弧长，不是最短步行路线。

下载的静态`brook-agent-interface-case.json`包括原六点目录、许可/归属
链接、ZIP/生成器/目录SHA256、真实Python/SDK版本和不同计数。它没有
原问题、隐藏状态或预写最终回答文本。实际SDK/stdio/函数运行不代表
模型推理；两个API演练仍用原创内存脚本响应。

直接/桥接各记录两次SDK请求，但本地派发与MCP调用尝试是不同层次。
MCP检查整段另含三个正常和两个拒绝案例，只选择其中同一距离作对照；
不能把五份结果叫五次决策、对三条路径排名或推算收费/服务执行次数。

原检查教程、三条编排联系和导览接到新文；验收链接复用既有题目。
当前24公开笔记、12路线38永久题、38条编排联系、64公开搜索元数据。
没有新学习ID、存储、自动掌握、网站依赖或模型服务。

## 真正从截图修正的部分

首版375px截图里三列表格过窄，“直接函数”等被挤断。改为一处有名字、
有即时焦点环的原生横向滚动组，保留可读列宽和语义表头，并在表格旁
说明键盘方向键。代码高亮自己的布局表格与数据表区别处理。

最终两URL十张Hallmark截图为0 FAIL/REFLEX/WARN；一次独立终审ship、
零发现。复核者在无页面JS的375px真实Chromium里把表格从0滚到最大
256px，保持焦点并成功下载/解析JSON。两份真实首版截图保留以供比较，
没有伪造此前不存在的新文章“旧版”。

本轮父线程另验证根/子路径、双主题320/390px：正文实际16→32px，表格
14.4→28.8px，方向键滚动正常、无整页溢出。这是DOM字体重排，不是完整
浏览器缩放。没有新增动画、图标、字体、玻璃层或持续运行效果。

## 实际验证

| 检查 | 实际结果 |
| --- | --- |
| `npm run build`、`npm test` | 通过；JS/项目既有SCSS检查，不代表全atlas.css无历史债 |
| `npm run test:atlas` | 137项通过，含来源/生成器哈希、私有字段、虚构证据与一致但错误的999距离拒绝 |
| 容器`bash tools/test.sh` | 43真实Jekyll案例/238断言，69 HTML/474内链通过 |
| 最终根/项目路径 | 实际Jekyll、Pages产物和正确文档根的HTMLProofer均通过，69 HTML/474内链 |
| 三份实际CLI | 已安装的固定SDK实际重放，三份选中结果一致；静态记录明确其范围 |
| Python3.11.18再核对 | 同三份ZIP SHA，非root/禁外网/只读容器内实际运行，三份选中结果和各自计数与3.12记录一致 |
| 28整站浏览器套件 | 一次完整全部通过；表格修正后针对新页面、下载与键盘/两倍字体在两路径另通过 |
| 原Python真实解释器 | 根/子路径四例、真实等待/取消、异常、输出上限、超时/停止/重载通过 |
| 新文章真实浏览器 | 390/768/1440双主题、下载内容/文件名、原题入口、axe、键盘、无JS320、无私人存储读取或自动外请求通过 |
| 设计检查 | 最终两URL十截图干净，独立finish review ship零发现 |

首次新浏览器断言数到4行，原因是选择器同时数入Rouge布局表，并非案例
数据多一条；已限定语义比较表。一次额外HTMLProofer误从项目子文件夹
当文档根，产生重复前缀的缺资源诊断；改按项目既有tools/test.sh从父目录
运行后通过。原始失败摘要与修正日志保留，不把错误命令说成网站故障。

补充无JS键盘断言曾在默认rAF轮询中超时，探针显示实际已经滚到40px；
页面定时轮询也受脚本禁用影响，最终在Node进程每50ms读取DOM，保留
真实Tab进入与方向键断言，不由测试代码设置scrollLeft。3.11容器首次因
公开绑定文件为600而在执行前拒读；只调整这些公开文件的读取位后，
维持非root/禁网/只读环境实际通过，没有扩大挂载或使用本地凭据。

全套回归使用冻结首版编译站点；最后只有这张表的语义包装/局部样式
改动，最终两路径针对检查、实际解释器、HTML/产物和设计截图另完成。
CI检查静态JSON与当前材料一致，不重放SDK，更不运行模型。真实CLI日志
与静态引用记录分开，哈希也不是作者/服务身份认证。

Safari/Firefox、实体机、OS输入法及完整浏览器缩放未验证；前轮记录的
355项既有atlas.css全文件Stylelint债未在此轮重排。没有更改生产工作流、
Pages、默认分支、自动合并或部署。资源归属见[compliance](iteration-28-compliance.md)。

## 文件与预览

主要改动：新`_atlas_notes/agent-interface-evidence.md`、原验收教程链接、
`assets/examples/agent-interface-case.json`、实际重放生成器与Node来源/
数值guard、浏览器检查和`assets/css/note-practice.css`的局部表格规则。
知识联系、首页构建记录、学习导览和开发文档同步更新。

[预审](design-audit-iteration-28.md)、[构建](iteration-28/build-results.txt)、
[浏览器](iteration-28/browser-results.txt)、[实际重放](iteration-28/replay-results.txt)、
[Hallmark](iteration-28/hallmark-results.txt)、[独立终审](iteration-28/finish-review.txt)。
真实首版/最终截图在`iteration-28/screenshots/`，最终渲染截图在
`iteration-28/hallmark-shots/`。

下载该开发分支成功CI的`atlas-review-preview`，在包含项目文件夹那层
按[PREVIEW.md](PREVIEW.md)运行静态服务，再打开：

```text
http://127.0.0.1:8000/Brook-ZzQq.github.io/study/ai/#agent-workshop
http://127.0.0.1:8000/Brook-ZzQq.github.io/playground/python/#async-wait
http://127.0.0.1:8000/Brook-ZzQq.github.io/knowledge/agent-interface-evidence/
```

源码ZIP、编译预览和Python学习ZIP各有不同用途。最新分支包含前序代码，
每个PR只展示相对上一轮的增量；线上不会因此自动更新。下一步先用少量
有权运行的真实任务写验收条件，区分资料、协议和任务结果，再考虑接入。
