# 第二十二轮：从字面命中，到保留完整条件

基于已推送且未合并的第二十一轮 `fec83c1`，分支
`feat/atlas-iteration-22`。这是五小时AI/Agent学习生态任务的后续阶段；
环境中断前后的工作分开记录，不把中断时段说成连续开发。

## 真正可以操作的检索

新增 `/playground/retrieval/`。四份原创虚构手册、八个完整片段和四个题目
共同说明“相关文字”与“支持这道问题的证据”有何不同。默认前两条
混有旧版；限定v2后，两条相关片段分别保留试用/正式空间的适用条件。
全部材料明确为AI辅助原创教具，不是校园或真实产品规定。

实际字面检索用NFKC/小写、空格分词、不同词的出现数和ASCII ID同分排序。
用户可以调整题目、词组、版本、前k条和上下文预算。precision@k按请求k
个位置计，recall使用本题全部标注；版本过滤不缩分母。RR是单题倒数排名，
不叫MRR；自由检索无标注时不计算分数。没有语义模型、向量库或自动裁判。

用户手动选择本次返回的整段，引用头、版本、节名和片段间空行一起进入
上下文，按Unicode码点计数，不称token。两段v2证据共167字符；第一段
需82字符，因此80预算拒绝、82预算恰好接受。拒绝不截断条件或破坏已有
选择。预算变化不倒改检索分数。真实JSON导出包含全部公开重放输入。

参数只在内存，修改保留旧结果并暂停选择/导出，显式重新检索才重开。
片段按钮保持焦点，手机上下文跳转就在按钮旁；出处链接打开原生来源
并聚焦具体节。无JS仍能阅读全部源片段、标注和原理。Jekyll与浏览器均
检查数据边界，坏ID/版本/标注在输出前失败，不把HTML字面文本执行成DOM。

现有RAG笔记和 `agent-context-evidence` 题目已接到实验；二十八个永久ID、
同一v1手记与原工具/循环实验均保留。十路线、十七公开笔记、二十一阅读
联系、五十五项公开搜索元数据；搜索不索引语料正文或私人手记。

## 视觉与实际修正

初版重复完整题目、规则文字挤占片段空间；现改短选择标签、单一已应用
问题和原生规则展开区。候选是排版清楚的列表，只有选好的上下文使用
轻玻璃；没有把所有段落卡片化或加循环装饰动效。

Hallmark最终真实CSS/URL检查0 FAIL / 0 REFLEX / 0 WARN。独立finish
review提出一项Floor39a：select与按钮高度不同。修正为相同52px与em可
增长高度后，五张截图复拍、实际浏览器检查、独立一次评分均确认resolved；
200%DOM字号下三者都为74px。详见 [设计审计](design-audit-iteration-22.md)。

全站回归还发现新首页记录漏填链接文字。现已补齐，模板也用真实标题
作缺省标签，再完整重跑；没有关闭axe规则或仅测试新页就声称无回归。

| 检查 | 实际结果 |
| --- | --- |
| `npm run build`、`npm test` | 通过 |
| `npm run test:atlas` | 126项通过，新增12项检索/上下文检查 |
| 容器 `bash tools/test.sh` | 34案例 / 202断言；62 HTML / 373内链通过 |
| 根路径构建、HTMLProofer、artifact guard | 通过 |
| 新实验浏览器 | 双主题×390/768/1440、预算/版本/标注、实际导出、焦点/隐私/异常通过 |
| 根路径公共页与检索/AI路径浏览器 | 通过：15公共页×双主题390px；检索与AI路线双主题/3尺寸 |
| 完整 `npm run test:atlas:browser` | 22套件全部通过，包含最终控件高度与首页链接修正 |
| 实际Pyodide | 三例、空均值、异常、输出上限、死循环超时、重载与停止通过 |

Safari、Firefox、真实手机、OS输入法与完整浏览器缩放仍未验证。没有把
DOM字号检查说成这些验证。没有真实LLM、embedding服务、权威正文采集、
私有索引、自动学习评分或网站部署。

## 文件与预览

主要新增：`playground/retrieval/index.html`、`assets/css/retrieval.css`、
`assets/js/atlas/retrieval-models.js` / `retrieval.js`、
`_data/retrieval_samples.json`、真实构建验证插件与模型/浏览器测试。
同步RAG笔记、路线、公开入口/搜索、首页记录和项目真实状态。

截图：[初版手机](iteration-22/screenshots/before-390-dark.png)、
[修正桌面](iteration-22/screenshots/after-1440-dark.png)、
[完整证据](iteration-22/screenshots/selected-390-light.png)、
[预算拒绝](iteration-22/screenshots/budget-390-light.png)。
原始日志：[构建/模型](iteration-22/build-results.txt)、
[浏览器](iteration-22/browser-results.txt)、[Hallmark](iteration-22/hallmark-results.txt)、
[独立审查与评分](iteration-22/finish-review.txt)。
本轮来源/隐私边界见 [compliance](iteration-22-compliance.md)。

从成功CI下载 `atlas-review-preview`，在包含项目文件夹的目录启动
`python3 -m http.server 8000`，打开
`http://127.0.0.1:8000/Brook-ZzQq.github.io/playground/retrieval/`。
参见 [PREVIEW.md](PREVIEW.md)。源码ZIP不能当作已编译的预览。
不修改Pages来源或生产配置，不合并、不部署。
