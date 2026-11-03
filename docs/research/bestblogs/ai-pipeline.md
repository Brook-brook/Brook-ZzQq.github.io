# AI 内容流水线：公开 DSL 能证明什么

证据级别沿用 [研究首页](README.md)。这里的“v4”是仓库子目录名，不代表已确认的生产版本。没有导入运行 Dify、调用模型或重放真实用户内容。

## 1. 先纠正“六维评分”的证据边界

[README](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/README.md#L29-L33)和 [能力表](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/README.md#L63-L74)称选题、内容、深度、实用、创新、表达六维评分（B）。但公开 v4 文章分析 DSL 使用另一套四个总分桶（A）：

| v4 Prompt 中的部分 | 分值 | 实际含义 |
| --- | ---: | --- |
| 内容深度 | 40 | 专业度、严谨性、完整性、原创洞察，各 10 |
| 相关性 | 30 | 领域契合、时效、受众匹配，各 10 |
| 实用性 | 20 | 可执行性、实践参考，各 10 |
| 创新性 | 10 | 思路/方法/贡献的新颖程度 |
| 额外减分 | -5 到 -20 等 | 入门教程、课程笔记、转述、某些理论研究、营销、错误等 |

证据：[Prompt 评分标准](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/flows/Dify/dsl/v4/BestBlogs%20%E6%96%87%E7%AB%A0%E5%88%86%E6%9E%90%E6%B5%81%E7%A8%8B.yml#L305-L329)。Schema 只要求一个总 score，并没有六个分项或自动加权算式。CLI [explain score](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/cli/src/commands/explain.ts#L65-L90)也只组装总分/标题/类型等字段，不能由此还原六维算法。

**结论：公开材料不足以复现 README 所说的当前六维评分。** 可能是未同步的历史流程或私有实现（D），不能反过来断言生产系统一定没有六维评分。另外，官方“六维兴趣标签”是兴趣分类/匹配概念，不是六项质量分数，不能混用。

对 Study 尤其重要：上述入门教程/课程笔记/理论论文减分代表特定策展口味，不是普适学习质量。基础投影、统计学、线性代数和遥感理论可能对学习极有价值；直接沿用 80 分门槛会排除应该认真学习的内容（C）。

## 2. 多代工作流的真实差异

本次静态解析 flows/Dify 下 24 个 YAML：22 个有 workflow.graph，2 个仅有 app 元数据（`filter_tweet_workflow_en.yml` / `filter_tweet_workflow_zh.yml`），不能算两个可执行筛选流程。

| 代表文件 | 公开结构（A） | 判断 |
| --- | --- | --- |
| [早期文章分析](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/flows/Dify/dsl/analyze_article_flow_zh.yml#L1-L20) | 16 节点；长文/分段分支、标签、评分、反思与改进；7 个 LLM 节点 | 适合研究多阶段成本与错误传播，不代表生产仍这样运行 |
| [文章流程说明](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/flows/Dify/ArticleAnalysisFlow.md#L1-L20) | 说明网站传文章 ID、获取并保存分析结果 | 应用负责调用/保存是 B；调用方源码没有公开 |
| [v4 文章分析](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/flows/Dify/dsl/v4/BestBlogs%20%E6%96%87%E7%AB%A0%E5%88%86%E6%9E%90%E6%B5%81%E7%A8%8B.yml#L1-L15) | DSL schema version 0.5.0；7 节点、1 个 LLM、成功/失败终点 | 更简单的单次全文分析，不能称为“多 Agent 辩论” |
| v4 文章初筛、文章翻译 | 同样各 7 节点；初筛靠 Prompt JSON，翻译启用 structured output | 每个流程的输出保障不同，不能统称都有严格 Schema |
| v4 播客/推文分析与翻译等 | 媒介不同，模型与 LLM 节点数也不同 | 不建议本科阶段一次复现所有媒介链路 |

archive 另有早期历史资料；[归档声明](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/archive/README.md#L1-L9)不是当前部署说明。Dify 插件和模型可用性还要独立验证，不能靠 YAML 能被解析就声称可重现生产。

## 3. v4 文章分析节点还原

~~~mermaid
flowchart LR
  S["Start：input_article_id"] --> H["HTTP：资源 Markdown 接口"]
  H --> P["Python：解析响应与字段"]
  P --> C{"success 字符串为 true"}
  C -->|是| L["LLM：全文分析 / JSON Schema"]
  L --> E["End：structured_output"]
  C -->|否| F["End：失败分支"]
~~~

| 节点 | 输入/输出与真实实现 |
| --- | --- |
| Start | required text-input `input_article_id`，max_length 20；[变量定义](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/flows/Dify/dsl/v4/BestBlogs%20%E6%96%87%E7%AB%A0%E5%88%86%E6%9E%90%E6%B5%81%E7%A8%8B.yml#L137-L148) |
| HTTP | 向 BestBlogs 资源 Markdown 接口取数；HTTP retry 配置 max_retries=3、retry_interval=100（单位未在此核实，不能凭空写毫秒）；[重试和 URL](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/flows/Dify/dsl/v4/BestBlogs%20%E6%96%87%E7%AB%A0%E5%88%86%E6%9E%90%E6%B5%81%E7%A8%8B.yml#L199-L211) |
| 解析 Code | json.loads，只有字典且 `success == 'true'` 才成功；输出 markdown/sourceName/title/url/languageName/destLanguageName/wordCount；默认失败，吞掉 JSONDecodeError/其它异常；[解析代码与类型](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/flows/Dify/dsl/v4/BestBlogs%20%E6%96%87%E7%AB%A0%E5%88%86%E6%9E%90%E6%B5%81%E7%A8%8B.yml#L226-L269) |
| 条件 | 比较解析后的成功字符串；[条件节点](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/flows/Dify/dsl/v4/BestBlogs%20%E6%96%87%E7%AB%A0%E5%88%86%E6%9E%90%E6%B5%81%E7%A8%8B.yml#L520-L541) |
| LLM | OpenRouter 的 google/gemini-2.5-flash；completion_params 为空字典，没有在此固定 temperature/seed；[模型配置](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/flows/Dify/dsl/v4/BestBlogs%20%E6%96%87%E7%AB%A0%E5%88%86%E6%9E%90%E6%B5%81%E7%A8%8B.yml#L293-L305) |
| End | 返回全文分析 structured_output；失败走另一终点；[成功输出](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/flows/Dify/dsl/v4/BestBlogs%20%E6%96%87%E7%AB%A0%E5%88%86%E6%9E%90%E6%B5%81%E7%A8%8B.yml#L162-L173) |

这里是 `/dify/resource/markdown` 的字符串 success 约定，**不是** CLI OpenAPI envelope 的布尔 success。迁移时应做明确的端点适配，不能到处用 `bool("false")` 或把所有响应当成一种形状。

在这个图里没有数据库写节点、采集 cron、去重库、审核后台、LLM 错误修复闭环。HTTP 有 retry 配置不代表模型输出失败也自动修复；具体运行时/provider 行为仍为 D。调用应用如何写库、过滤低分、触发翻译由官方说明描述（B），公开图不能验证全链路。

## 4. Prompt 组织与可解释性的局限

全文分析 Prompt 包括角色/目标、评分分布、分桶标准、扣分项、领域与标签、观点/金句提取、JSON 例子和 few-shot 示例。其价值是把“输出什么”和“为什么这样判断”写清楚，比只要求“总结一下”更容易评审。

但有四个边界：

1. “90+ 少于 10%”“网站只展示 80+”是 Prompt 中的编辑指引，不是公开评测数据或已验证的服务端过滤实现。
2. 输出 remark 是模型给出的解释，不等于可审计的分项算分、事实引用或可重复的真实因果依据。
3. 多次采样、模型版本变化、原文长度、语言与媒体类型都可能改变排序；低 temperature 也不保证相同结果。
4. 领域枚举面向软件/AI/设计/商业，并非 GeoAI 数据集/论文的完整学科分类。把旧分类直接搬过来会失去 GIS 的分辨率、坐标系、数据偏差和空间泛化问题。

还存在代际漂移：[术语文档](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/docs/10-TERMINOLOGY.md#L428-L439)说 aiSubcategory 已废弃，而 v4 Schema 仍保留该字段。这进一步说明目录名不足以证明生产用哪套模型/分类。

## 5. JSON Schema 的具体质量问题

[Schema 原文](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/flows/Dify/dsl/v4/BestBlogs%20%E6%96%87%E7%AB%A0%E5%88%86%E6%9E%90%E6%B5%81%E7%A8%8B.yml#L433-L499)确实存在，且 structured_output_enabled=true；不能误报为“没有结构化输出”。不过：

| 字段/约束 | 静态问题（A） | 后果（C） |
| --- | --- | --- |
| mainPoints.items | object，properties={}，required=[]，additionalProperties=false | 按标准 JSON Schema 只允许空对象；Prompt 期待 point/explanation，发生冲突。具体 provider 是否忽略/拒绝需运行验证（D） |
| score | type number，描述写 0–100 整数，但无 minimum/maximum/integer | Schema 本身不排除负数、小数和超过 100 的值 |
| keyQuotes | 字符串数组，没有条数/来源位置校验 | 不能保证 3–5 条或真的是原文 |
| tags / summary | 数量、长度只写在描述/Prompt | 需要额外业务校验；格式有效不等于合规 |
| 顶层 required | 只有 domain/summary/oneSentenceSummary/score | 缺少观点/引用仍可通过这个 Schema；没有六分项输出 |

这是一项适合亲手练的迁移：先独立定义一个小而严格的研究记录结构，校验 score 范围/类型（排除 Python bool）、证据链接和复核状态，再讨论模型选择。不能通过把所有字段 optional 来让“测试全绿”。

## 6. 多阶段、失败与成本

早期文章图长文直接分析后再做标签、评分、反思、改进；分段分支先逐段处理再合成。按可见节点推算（C），直接路径约 5 次 LLM 调用；p 个分段路径约 p+5 次。节点数不是固定收费次数，重试和运行分支还会改变它。分段避免单次上下文过长，但重复 Prompt、合成丢失和错误级联也会增大。

v4 将全文分析收敛为单 LLM 节点；省下编排不等于总成本总会更低，全文长度、provider 价格、重试、翻译和结果质量决定实际成本。流程中没有可验证的每日预算或完整缓存策略；不能说已实现精准成本控制（D）。

自己的最小方案：

- URL/内容哈希去重；缓存键至少包括内容哈希、Prompt 版本、schema_version、模型 ID/参数；变化后重新分析。
- 限定 10–20 条、输入字节/token 上限、最多一次受预算约束的修复；失败保留 error，不生成假摘要。
- 费用估算 `C = Σ(T_in × P_in + T_out × P_out) / 1,000,000`；重试/翻译另计，批处理前先显示估算并有预算硬上限。
- example：100 篇各 2000 输入 + 300 输出 token，共 0.20M/0.03M；若**假设**价格为 $1/M 输入、$4/M 输出，成本 $0.32，重试另算。这是演算，不是 BestBlogs 账单或实时供应商报价。
- 静态网站永远不直接持有模型/BestBlogs Key；离线实验默认 $0。截断原文必须记录 truncated=true，不把不完整阅读伪装为全文结论。

## 7. 如何验证评分，而不是相信漂亮 JSON

建议的自编小评测（C，尚未对上游模型执行）：

1. 选 12–20 条获准使用的材料，覆盖基础教程/空间算法/GeoAI 论文/工程实践，以及一条错误/过期信息；保留原文版本和日期。
2. 人工先标“与当前问题相关性、证据可靠性、学习前置条件、可复现性”，不要用热度代替质量。
3. 同一模型/Prompt/Schema 各跑 3 次，记录输入哈希、版本、参数、费用/延迟和全部失败。
4. 检查结构通过率、原文引用可定位率、关键事实错误率、人工/模型排序一致性、重复采样稳定性；小样本报告原始计数，不夸称统计显著。
5. 对错误引用、长文截断、提示注入、坐标/单位混淆设为阻断项；宁可 needs_review，不自动发布。

GeoAI 必须增加：数据集许可证、CRS/单位、空间/时间范围、分辨率、训练/验证地理隔离、空间自相关泄漏与跨区域泛化。BestBlogs 本身没有公开验证这些地理科学能力；内容评分不能替代 GIS 实验和科学判断。
