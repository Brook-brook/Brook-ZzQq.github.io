# 第二十六轮：把SDK提议与MCP工具接起来

基于已推送、未合并的第二十五轮`a459656`，开发分支
`feat/atlas-iteration-26`。本轮补齐宿主适配和运行证据，保留所有原项目、
实验与手动学习记录；不把两份SDK安装成功当作完整Agent。

## 实际交付

`/knowledge/agent-mcp-bridge/`新增原创AI辅助教程与约28KiB真实练习包。
实际异步SDK3.50.0接收原创内存假响应，宿主经MCP2.3.0真实stdio调用
既有三项只读函数，再将结果带回对应provider call_id用于下一次请求。
必要的provider上下文保留，原问题/隐藏reasoning不进入公开trace。

宿主核对真实discovery/固定schema，用可信本地契约构造工具定义；整批
提议在任一MCP尝试前验证。分别计数provider请求尝试、MCP调用尝试、
SDK错误和接收/拒绝的回执，不把客户端尝试冒充服务执行次数。中途预算
保留已经接收观察，不补造第二个结果或最终文本。取消向调用者传播，
此前观察保留在运行对象中；已发出请求/读操作不会被描述为撤销。

结果先查错误、文字/结构一致，再对照本小目录确定性参考。缺字段在SDK
失败，形状正确的999距离或文字不符在宿主拒绝。不是通用事实核查或
服务内部执行证明；最终文本依然未核实。通用provider是否推理未知，
`model_called:null`；明确的本包MockTransport才设false，不虚报来源。

三个原项目保持独立。桥接ZIP复用原MCP服务/契约、受控提取的纯工具及
既有原创fixture，没有第二份数学实现；十五个明确源文件加MANIFEST，
公开SHA和每个源/转换/生成SHA保持可核对。原Agent/MCP包检查同时保留。

## 学习入口和手机修正

AI入口用三段原生有序练习说明不同层次，保留原下载/路线。手机长标题
拆开了动词，实际截图后缩短，并把下载名称明确为直接函数项目。没有
新增卡片墙、花哨动画或大型依赖。新教程有提前下载、可滚动代码、语义
角色表和字段表，手机仍能阅读和键盘操作。

两道永久题目追加到同一搭建路线，共11路线36题；公开笔记22、编排联系
32、搜索元数据61。旧34 raw和导出在paths/practice完全保留，明确填写/
勾选才增加第35条。公开文章/搜索不读取私人手记，也不自动推断完成。

## 实测

| 检查 | 结果 |
| --- | --- |
| `npm run build`、`npm test` | 通过 |
| `npm run test:atlas` | 134项，含原两包/新包源与实际纯组件检查 |
| 容器`bash tools/test.sh` | 43案例/238断言，67 HTML；最终HTMLProofer451内链通过 |
| 根/项目路径、artifact guard | 构建/内链/资源通过；原生桥接下载和旧34恢复在两路径通过 |
| 实际SDK与真实ZIP/CLI | Python3.12四项解压检查、包内12项通过，含七种CLI状态/参数组合 |
| 最低Python3.11 | 实际3.11.18；同一ZIP、UID10001、禁外网/只读rootfs/tmpfs，12项全部通过 |
| 新教程/三段入口浏览器 | 390/768/1440双主题、axe/无JS/键盘、真实ZIP哈希、320px/实际正文2倍、旧34记录通过 |
| 真实Pyodide | 三例、异常/空均值、输出上限、超时/重载/停止通过 |
| 全站26浏览器套件 | 单次完整命令从头到尾通过、退出0；文字修正后的新入口/教程另完整通过 |
| Hallmark/独立设计复核 | 三真实URL/15最终截图0 FAIL/REFLEX/WARN；ship零发现 |

容器首次安装受基础镜像CA缺失影响，使用现有会话CA的BuildKit secret
后通过，未关闭TLS或把CA复制进镜像。程序检查以非root运行；原root-owned
公开ZIP的身份哈希另用只读root步骤读取，与当前下载完全一致。不是对
任意程序的沙箱承诺。完整范围见[来源](agent-bridge-source-review.md)。

Safari/Firefox、实体手机、OS输入法、完整浏览器缩放、真实模型/远端
认证和其他宿主未验证。DOM正文2倍不是完整浏览器缩放；预写回包不是
模型成绩。无Pages/生产工作流/默认分支变更，没有自动合并或部署。

## 文件与证据

主要文件：新教程、`_includes/agent-mcp-bridge/`、新ZIP/清单、明确打包
输入和受控fixture提取、SDK/CLI与浏览器检查；原AI入口、路线/题目/
联系、首页记录和MCP文章后续链接同步更新。

[设计审计](design-audit-iteration-26.md)、[compliance](iteration-26-compliance.md)、
[构建日志](iteration-26/build-results.txt)、[浏览器](iteration-26/browser-results.txt)、
[真实包/最低版本](iteration-26/archive-results.txt)、[Hallmark](iteration-26/hallmark-results.txt)、
[独立复核](iteration-26/finish-review.txt)。前后截图在iteration-26/screenshots/。

从成功CI下载`atlas-review-preview`，按[PREVIEW.md](PREVIEW.md)启动本机
HTTP服务，再打开`/Brook-ZzQq.github.io/study/ai/`或
`/Brook-ZzQq.github.io/knowledge/agent-mcp-bridge/`。Python连接包另按自身
README安装运行，网页预览不会替你执行它。下一步补清async/await与取消
的Python基础，再把这些程序契约带到自己有权运行的真实模型任务评估。
