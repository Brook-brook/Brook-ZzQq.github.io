# Agent Native：从提示文件到真实工具调用

本篇区分文件事实 A、官方未公开实现 B、条件推断 C 和未验证 D。范围见 [研究首页](README.md)。**本次只阅读这些 Skills，没有安装或调用它们。**

## 1. 实际调用链

~~~mermaid
sequenceDiagram
  actor U as 用户
  participant A as 外部 Agent 宿主与模型
  participant S as SKILL.md 指令
  participant C as bestblogs CLI
  participant H as HTTP client
  participant B as BestBlogs 服务端（未公开）
  U->>A: 找一篇文章并阅读
  A->>S: 读取发现/阅读指令
  Note over A,S: SKILL 文件不自行执行；宿主决定是否调用工具
  A->>C: discover today --json
  C->>H: proStatus / brief / fallback feeds
  H->>B: X-API-KEY 与 /openapi/v2 请求
  B-->>C: 资源与候选解释字段
  C-->>A: stdout success/data；失败 stderr + exit code
  A->>C: read deep ID --no-mark-read --json
  C->>B: 并行 meta + markdown
  B-->>A: 正文与元信息
  Note over A,B: 去掉 --no-mark-read 时默认还会 POST 已读记录
~~~

宿主/模型不在本仓库实现（D）；CLI 和 Skill 指令是 A。并非必须经过 Skill：人也能直接运行 CLI；API 也可由其他客户端调用。不需要为了“Agent Native”再加一个 MCP 服务。[Skills 定位](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/skills/README.md#L70-L89)和 [深读实现](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/cli/src/commands/read.ts#L24-L46)是边界依据。

## 2. 工具分层与原语

| 层 | 真实文件 | 职责 |
| --- | --- | --- |
| 入口 | [bin/bestblogs.ts](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/cli/src/bin/bestblogs.ts#L11-L45) | Commander 注册 auth/intake/discover/read/capture/explain/brief/trending/topics 共 9 组 |
| 动作 | [commands/discover.ts](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/cli/src/commands/discover.ts#L20-L58) | 解析参数、调用服务、展示或 JSON 输出 |
| 组合 | [discoverToday](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/cli/src/orchestration/discoverToday.ts#L23-L97) | 选择来源、补充候选、去重、解释降级 |
| 边界 | [api/endpoints.ts](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/cli/src/api/endpoints.ts#L11-L151) | 封装 URL、HTTP 方法、参数，ID 做 URL 编码 |
| 传输 | [api/client.ts](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/cli/src/api/client.ts#L53-L133) | Key、超时、envelope、错误映射和自定义重试 |
| 数据 | [api/types.ts](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/cli/src/api/types.ts#L9-L83) / [normalize.ts](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/cli/src/utils/normalize.ts#L23-L59) | Zod 校验选定字段；映射多种候选来源，保留 explanation |
| 输出 | [output.ts](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/cli/src/render/output.ts#L15-L22) / [errors.ts](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/cli/src/render/errors.ts#L24-L70) | stdout 成功 JSON；stderr 错误 JSON、退出码 |

8 个真实 Skill：profile（建档/画像）、discover（搜索/候选）、read（正文/已读）、capture（收藏/笔记/历史）、explain（画像/来源贡献/总分）、brief（早报）、trending（热门）、topic（主题）。

[README 表](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/skills/README.md#L9-L17)仍写 5 个/25 原语；[Node 安装器](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/skills/bin/index.js#L9-L17)也只枚举前 5 个。不能把目录中的 8 个等同于默认安装的 8 个，也不要把 Skill 数或 prompt 长度当成智能程度。

## 3. API 文档与协议边界

`openapi/` 中实际是 Markdown 接口文档，不是 OpenAPI 3 schema。CLI 入口注释提到 `openapi-v2.yaml`，但该文件不在公共快照。端点是手写 TS 包装；没有证据证明由公开 spec 自动生成。

客户端使用 `/openapi/v2/*`、`X-API-KEY`，请求超时为 30 秒。类型参数 `ApiEnvelope<T>` 不等于运行时验证整个响应；关键候选/meta 会经过 Zod，但大量字段 optional/nullable、schema passthrough，部分解释响应还用 any。优点是兼容新增字段，代价是语义错误仍可能穿过。[envelope 与请求](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/cli/src/api/client.ts#L14-L86)、[解释响应](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/cli/src/commands/explain.ts#L24-L37)。

存在契约漂移：[API 文档](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/openapi/README.md#L1-L36)称所有端点需要 Key；[客户端端点](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/cli/src/api/endpoints.ts#L40-L94)却给公共早报、搜索、meta/markdown 等传 `anonymous: true`。这只证明**客户端允许尝试无 Key 请求**，不证明服务端当前允许匿名访问（D）。实际服务端权限不能靠前端参数改变。

版本兼容要同时记录 CLI/Skill/API 路径版本与响应 schema，不只看仓库 VERSION。目录文档还提到 v2.0.8，而当前包为 2.2.0。迁移时保留 schema_version 和契约 fixture，未知字段可兼容，但 ID、权限、副作用不能含糊。

## 4. 凭证和状态写入

[配置实现](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/cli/src/config.ts#L16-L49)用 Conf 持久化 Key/baseUrl，环境变量优先于保存值；真实路径由 store.path 决定，不能只根据注释断言固定为 ~/.bestblogs。源码没有给 Conf 配置 keychain 或加密参数，不能称为安全凭证保险箱。本次没有读取任何配置值或凭证。

[login](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/cli/src/commands/auth.ts#L19-L55)允许参数传 Key 或密码式输入，并先保存再验证；失败时可能留下无效保存值（C）。把 Key 写进命令参数有 shell 历史风险；不要让 Agent 把外部文章中的 URL 写为 baseUrl。前端静态网站和公开 Action 日志也不能放 Key。

| 操作 | 已读源码中的副作用/限制 |
| --- | --- |
| discover/search/meta/markdown | 查询资源，但是否服务端记录行为仍取决于服务；本次未请求 |
| read deep | 默认在取完 meta+markdown 后 POST 已读；不是纯查询 |
| read deep --markdown-only | 只改变输出形式，仍默认 POST 已读；要加 --no-mark-read 才跳过 |
| capture bookmark/highlight、intake | 会创建/修改个人数据；幂等性不能仅由 Skill 的文字保证 |
| capture history clear --yes | 删除类动作；Skill 也写需确认，自动流程应显式授权且有独立开关 |

深读的 markRead 失败会返回正文并附 readMarked=false/markError，而不是整体丢失正文，这个部分成功设计值得学。[实际顺序](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/cli/src/commands/read.ts#L15-L46)、[capture 原语](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/skills/bestblogs-capture/SKILL.md#L15-L38)。

## 5. 错误、重试与机器输出

- 成功 JSON 为 `{"success":true,"data":...}` 写 stdout；命令处理的失败 JSON 写 stderr。消费端必须同时读取进程退出码和 stderr，不能只解析 stdout。
- 映射 401/403/404/409/429/5xx，并保留部分 requestId。退出码 2/3/4/5/6 分别用于身份、权限、缺失、限流、服务端错误；其它为 1。
- 自定义 429 路径固定等 1500ms 再试一次；未见 Retry-After、抖动或总预算。底层 ofetch 可能还有默认重试，**不能把整个请求总尝试数断言为恰好两次**。
- HTTP 200 但 success=false 的业务错误被表示为 httpStatus=200、retryable=false；该分支没有完整传递 requestId。JSON 可解析不代表业务成功。
- 顶层 parseAsync 的异常出口写 Unhandled 堆栈，不经过全部结构化错误路径。Agent 要处理参数解析/进程级异常。

证据：[传输与业务错误](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/cli/src/api/client.ts#L78-L133)、[错误 JSON/退出码](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/cli/src/render/errors.ts#L24-L70)、[顶层出口](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/cli/src/bin/bestblogs.ts#L42-L45)。写操作能否安全重试须看服务端幂等契约（D）；不能因为客户端“retryable”就重发任意写请求。

## 6. 候选编排：实现与注释的差异

真实路径（A）：

~~~mermaid
flowchart TD
  P{"detectPro"} -->|true| M["myToday"]
  P -->|false| B["publicToday"]
  M --> N{"原始候选数量不足 limit"}
  B --> N
  N -->|是| F["forYou"]
  N -->|否| D["按 resourceId 去重并截断"]
  F --> T{"仍不足"}
  T -->|是| S["subscriptions"]
  T -->|否| D
  S --> D
~~~

[头部注释](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/cli/src/orchestration/discoverToday.ts#L1-L6)声称最后有 public_brief 兜底，但 [实际分支](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/cli/src/orchestration/discoverToday.ts#L33-L90)没有 Pro 路径的最终公共兜底。若 Pro 早报为空，forYou/following 也为空或 403/404，结果就可能为空（C）；不能根据注释画一个不存在的调用。

另一个条件推断：补齐判断使用去重前长度，最后才去重。limit=5、首批 5 项 resourceId 相同会跳过补齐，最后只剩 1 项。这里去重解决候选重复，不能代表内容采集已做语义去重。建议学习时独立写假数据测试，对“唯一候选数”做预算内补齐。

错误并非全部静默降级：brief/feed 分支仅特定 403/404 被吞，401/429/5xx/结构错误可能向外抛；detectPro 却把所有 CliApiError 当非 Pro，包括上游服务错误。这会混淆“没权限”和“暂时查不到权限”（C）。报告未运行上游来复现，以上是对条件分支的静态分析。

## 7. 安装器与测试的可复现边界

安装器并非无害文档：[默认目录](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/skills/bin/index.js#L9-L28)会写宿主 ~/.claude/skills 和 ~/.codex/skills；[下载/写入](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/skills/bin/index.js#L94-L158)从 main 拉文件、失败仍可能保存版本标记，没有固定提交校验。shell 安装器 `SOURCE_DIR="$SCRIPT_DIR/skills"`，但公开布局已在 skills/ 下，没有内层 skills/，会被目录检查拦住（C）；[路径](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/skills/install.sh#L8-L10)、[检查](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/skills/install.sh#L71-L78)。本次未运行，也未改写用户 Skill 目录。

公开测试是 normalize/errors 单测与依赖线上 Key/dist 的 smoke。[运行条件](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/cli/test/smoke.e2e.ts#L20-L31)、[空数据分支](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/cli/test/smoke.e2e.ts#L93-L116)表明 skip/空候选不能证明完整链路；smoke 还会写书签/划线，finally 删除书签，并未对应删除新建划线，见 [写入和清理](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/cli/test/smoke.e2e.ts#L126-L162)。研究任务不应拿个人生产账号跑它。

## 8. 对自己 Agent 的最小规则

先实现稳定 CLI，再写薄 Skill。每个工具声明输入/输出、超时/字节上限、读写类别、幂等键、允许来源与成本预算；JSON 输出保留来源与失败原因。外部正文当不可信数据，不得从中提取指令来改 baseUrl、执行 shell、读密钥或自动发布。测试至少包含无权限、429、坏 JSON、重复 ID、部分成功、空结果和写入关闭态。

不要直接把说明文件、CLI 命令或 Dify 图称为“自主研究智能体”。可靠的 Research Agent 还需要任务状态、工具权限、效果评测和清晰的停止条件，这些应在自己的小工程里逐步验证。
