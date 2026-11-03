# 架构逆向分析

范围与 A/B/C/D 定义见 [研究首页](README.md)。所有 BestBlogs 引用固定在 `756ffbddf5cf4cd87e383a82b7c997563032e93f`，静态阅读不证明线上部署状态。

## 1. 公共仓库真正包含什么

| 目录 | 已核实的内容（A） | 不能由此推出的结论 |
| --- | --- | --- |
| README.md / README.en.md / VERSION / changelog | 产品入口、公开同步版本说明 | 宣传中的能力均有公开实现 |
| docs/ | 13 份产品、品牌、架构、开发、测试、运维文档 | 私有 monorepo 和发布 hooks 已可运行 |
| cli/ | TypeScript 客户端、配置、API 包装、编排、Zod、测试、构建/锁文件 | 已公开服务端鉴权、推荐/采集算法 |
| skills/ | 8 个 SKILL.md、Node 安装器和 shell 安装器 | Agent 宿主、LLM 或通用自主 Agent 已实现 |
| openapi/ | README + 5 份 Markdown 接口文档 | 包含可供代码生成的 OpenAPI 3 YAML/JSON |
| flows/Dify/ | 技术说明和多代 YAML DSL | 当前生产系统仍在运行全部流程 |
| archive/ | 明确标记不维护的 v1 文档、早期流程/资料 | 历史接口仍可用 |
| 根 OPML、opml/、RSS 指南 | 订阅源列表/输出 feed 使用说明 | 完整抓取器、任务队列或内容授权 |
| posts/、images/ | 公共文章、示意图和资源 | 可自由复制到个人网站 |

公开树没有 bestblogs-app/admin/api/admin-api/common/worker 的应用实现，也没有其数据库定义和生产部署拓扑。[官方组件列表](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/docs/13-INFRA-DEPS.md#L5-L21)描述它们，但这属于 B。[archive 维护边界](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/archive/README.md#L1-L9)明确是历史资料。

## 2. 实际可追踪的调用层与官方业务层

~~~mermaid
flowchart TB
  subgraph A["A：公开源码或配置"]
    S["8 个 SKILL.md"] --> C["CLI 命令"]
    C --> O["候选编排 / 归一化"]
    O --> H["HTTP API client"]
    C --> H
    P["OPML 来源清单"]
    W["Dify DSL：取 Markdown / 分析 / 返回"]
  end
  subgraph B["B：官方描述，生产代码未公开"]
    API["BestBlogs API / 鉴权 / 配额"]
    I["抓取、导入、预处理与任务状态"]
    Q["公共质量池 / 私人来源池"]
    R["推荐 / 早报 / 编辑校准"]
    DB["MongoDB 主状态 / ES 读模型 / Redis 协调"]
    I --> Q --> R
    Q --> DB
    R --> API
  end
  H --> API
  P -. "接入方式未能从生产代码验证" .-> I
  I -. "调用及持久化由应用负责：文档描述" .-> W
  W --> API
~~~

箭头不是完整线上拓扑。Dify 中的 HTTP 节点实际请求资源 Markdown 接口，而不是公开实现了一套网页抓取器；客户端 API 连接生产服务，也不是本地复刻后端。

## 3. 内容采集：哪些可知，哪些未知

官方主链路是“来源 → 抓取/导入 → 预处理 → 过滤 → 分析 → 翻译 → 审核/校准 → 公共/私人池”，见 [内容进入链路](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/docs/4-ARCHITECTURE.md#L420-L445)（B）。需要分清三件事：

- **输入来源清单（A）**：根 `BestBlogs_RSS_ALL.opml` 有 400 个含 xmlUrl 的 outline，400 个不同 URL；文章 170、播客 30、社交 160、视频 40，是全量的分类切片，不是另外 400 条。OPML 是订阅目录，不是 RSS 文章正文或爬虫。
- **产品对外输出的 RSS（B）**：[RSS 指南](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/BestBlogs_RSS_Doc.md#L5-L83)提供语言、类型、分类、最低分等查询条件；[更新说明](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/BestBlogs_RSS_Doc.md#L130-L134)称每小时更新、最多 100 篇。这是输出 feed 约定，不能推断每个输入源的采集 cron；本次没有请求 feed 验证。
- **分析输入（A）**：v4 DSL 接收文章 ID，由 HTTP 节点向 `/dify/resource/markdown` 取已准备的数据，[输入](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/flows/Dify/dsl/v4/BestBlogs%20%E6%96%87%E7%AB%A0%E5%88%86%E6%9E%90%E6%B5%81%E7%A8%8B.yml#L137-L148)、[取数与解析](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/flows/Dify/dsl/v4/BestBlogs%20%E6%96%87%E7%AB%A0%E5%88%86%E6%9E%90%E6%B5%81%E7%A8%8B.yml#L199-L242)。

| 问题 | 证据与边界 |
| --- | --- |
| RSS/Atom 如何接入 | B：有来源域和治理原则；D：解析器、ETag/Last-Modified、全量/增量策略未公开 |
| 正文如何提取 | A：DSL 消费后端返回的 Markdown；D：HTML 清洗、正文抽取器、平台适配器源码未见 |
| 内容如何去重 | A：CLI 最后按 resourceId 去候选重复；D：采集端 URL 归一化、文本指纹/语义去重未见，不能混为一谈 |
| 失败如何处理 | A：部分 DSL HTTP 节点有有限重试、解析成功条件与失败终点；B：单源隔离、降级/禁用；D：生产死信、补偿、告警实现 |
| 如何调度 | B：Job + 数据库状态 + 分布式锁/幂等；D：具体 cron、锁 TTL、抢占/续租、批量大小 |
| 来源如何管理 | B：公共/私人来源隔离、关注关系和用户可见性；D：索引、权限查询实现、实际隔离效果 |

[订阅源治理](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/docs/11-OPERATIONS.md#L217-L225)还要求 SSRF、重定向、大响应防护。这些是应该学习的约束，不是本次已穿透测试的安全保证。

## 4. 生产架构的官方描述

[技术与中间件边界](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/docs/4-ARCHITECTURE.md#L783-L930)（B）描述 Java 21、Spring Boot 3.x、MongoDB、Elasticsearch、Redis、Next.js App Router/React，以及暂缓的 React Native/Expo 移动端：

| 设计 | 有价值的原因 | 当前迁移判断（C） |
| --- | --- | --- |
| MongoDB 为业务真相，ES 为可重建读模型 | 搜索索引不能决定权益/私有内容归属 | 个人实验先用 JSON/SQLite；理解真相与索引分离 |
| Redis 做共享缓存、锁、限流与短期状态 | 解决多实例协调，不当作永久权益存储 | 单机脚本暂不需要 Redis |
| 暂不引入独立 MQ | 文档明确没有需求就不增加运行单元 | 不要误称其为 Kafka 微服务流平台 |
| worker 作为库由 admin-api 承载 | 扩容/隔离需要成立后才拆进程 | 小项目先保持单进程与模块边界 |
| 公共质量、个人兴趣与私有来源分离 | 通用质量不是“我想学什么”；私有数据不进入公共池 | 公开研究笔记与私人草稿也应隔离 |

文档没有提供实际节点数量、账单、私有索引和服务性能；本报告不补猜。

## 5. 公开 CLI 依赖与工程边界

[CLI 包配置](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/cli/package.json#L1-L44)：Node ≥20、TypeScript、Commander 命令解析、Zod 数据校验、ofetch 请求、Conf 本地配置、Chalk/Ora 显示、Prompts 交互；开发工具为 tsup、tsx、Vitest。锁文件固定的实际版本与 package.json 的范围不同，详见 [许可审查](open-source-audit.md)。

实际读法：[入口注册](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/cli/src/bin/bestblogs.ts#L11-L45) → [命令动作](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/cli/src/commands/discover.ts#L20-L38) → [候选编排](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/cli/src/orchestration/discoverToday.ts#L23-L97) → [路径封装](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/cli/src/api/endpoints.ts#L40-L67) → [HTTP 客户端](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/cli/src/api/client.ts#L53-L110)。归一化集中在 [两个映射函数](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/cli/src/utils/normalize.ts#L23-L59)，没有让显示层直接处理每种服务端形状。

## 6. 工程文档如何协作

下面“要求存在”为 A，“对应生产执行已落实”为 D/B。没有因为看到流程图就运行上游的 agent 指令。

| 文档 | 阅读所得及用途 |
| --- | --- |
| [VISION](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/docs/1-VISION.md#L159-L196) | 明确不以时长/量取胜、不替用户判断、不做泛化工具箱；需求越界时有拒绝依据 |
| [PRODUCT](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/docs/2-PRODUCT.md#L126-L171) | 描述当前产品结构与 3.0 主题早报方向；方向不等于已发布功能 |
| [ARCHITECTURE](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/docs/4-ARCHITECTURE.md#L19-L30) | 保持长期组件/领域边界，具体 cron/参数下沉到实现和 runbook |
| [DESIGN](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/docs/5-DESIGN.md#L190-L240) | 判断优先于装饰，区分质量/相关性/个性化，建立层级与阅读节奏 |
| [UI-SPEC](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/docs/6-UI-SPEC.md#L42-L119) | 将原则落为语义 token、复用组件、移动端信息优先级；不能只等比缩小 |
| [CONVENTIONS](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/docs/7-CONVENTIONS.md#L59-L145) | Controller → 应用 → 领域 → Repository/Adapter；输入校验、分页、外部调用与测试边界 |
| [CURRENT_STATE](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/docs/8-CURRENT_STATE.md#L7-L27) | 区分已交付、验证中与暂缓能力；公开状态仍是官方陈述 |
| [TESTING](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/docs/9-TESTING.md#L14-L88) | L0/L1/L2 分层，禁止仅断言“不报错”；计费/权限/隐私要求失败和关闭态覆盖 |
| [OPERATIONS](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/docs/11-OPERATIONS.md#L17-L75) | 配置单一真相、服务/API/管理 UI 三处一致、默认关闭与 kill switch |
| [WORKFLOW](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/docs/12-WORKFLOW.md#L194-L260) | 计划→编码→测试→文档→自测，评审与一致性门禁；实际 hooks/多数开发 Skills 不在公共目录 |
| [INFRA-DEPS](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/docs/13-INFRA-DEPS.md#L45-L99) | 外部依赖按强/中/弱影响分级，AI/音频失败不应破坏基础阅读 |

这些职责比照抄 13 份长文更值得学：小改动只同步受影响事实，建立“需求 → 证据 → 测试 → 发布说明”的短闭环。技术债务应有影响、触发条件、解决窗口；过期 flag 要清理，避免无限积累。

发布规则见 [人工验证与 release](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/docs/12-WORKFLOW.md#L264-L285)；回滚顺序见 [灰度与回滚](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/docs/11-OPERATIONS.md#L155-L176)：先关 flag/外部写，再考虑补偿与代码回滚。**关闭入口不会自动撤销已经发生的数据写入**（C）；要单独定义补偿和恢复验证。对静态个人网站，分支/PR、备份数据与 revert 通常已足够，不需要复制商业产品的每日发布分支体系。

## 7. 学习与工程投入判断

建议自己实现：单源读取、URL/ID 去重、归一化、错误类型、有限重试、结构校验、证据记录和离线测试。它们能检验理解而且规模可控。

可以使用现成服务/库：成熟 RSS 解析器、LLM 推理 API、可选 Dify 可视化原型；使用前分别核实许可与隐私，不为学习基础而先运维模型集群。

暂不迁移：支付/Pro、商业运营、活动域、多端应用、搜索集群、复杂用户画像。对 BestBlogs 的业务它们可能合理；对当前个人空间尚无需求证据，属于新增维护面而非工程能力证明。
