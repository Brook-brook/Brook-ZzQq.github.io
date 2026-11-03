# 开源、内容与 API 合规审查

审查日期：2026-11-03。快照 `756ffbddf5cf4cd87e383a82b7c997563032e93f`。本篇是迁移前的工程授权核对，未替权利人补写授权。

## 1. 核心结论

**不能称整个 BestBlogs 仓库采用 MIT。** 根目录未找到 LICENSE；递归跟踪文件未发现独立 LICENSE/COPYING/NOTICE 正文。CLI 和 Skills 的 package.json/README 明确声明 MIT，只能作为这些构件的局部声明。复制/修改之前仍应确认适用范围、完整许可正文与版权通知。

本轮只独立撰写研究、引用短的接口/字段名和定位源码，离线实验也是自编；没有把外部实现、图片、字体、图标、OPML、全文内容或 Prompt 复制到网站，没有新增依赖。现有 THIRD_PARTY_NOTICES.md 无新增集成项；本报告记录研究来源和后续准入条件，不假装已经迁移代码。

## 2. 分目录与资源审查

| 范围 | 核实结果 | 当前可做 | 迁移前必须核实 |
| --- | --- | --- | --- |
| 根目录/整体 | 没有统一 LICENSE；GitHub 元数据也未给出统一 license | 阅读公开材料、独立分析并链接证据 | 向作者确认未明确授权部分的许可范围 |
| cli/ | [package.json](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/cli/package.json#L55-L61)写 MIT；[README](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/cli/README.md#L136-L138)写 MIT；根 README 也特指 CLI MIT | 学习分层与独立实现 | 原始版权人通知、完整 MIT 正文与发行包实际文件；不要只留一句 MIT |
| skills/ | [package.json](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/skills/package.json#L19-L24)与 [README](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/skills/README.md#L104-L110)写 MIT | 阅读组织和薄包装思想 | 明确覆盖 SKILL/安装器的范围，保留版权和完整许可 |
| docs/、README、posts/ | 没有核实到统一可再分发许可 | 用自己的语言研究、短引用并给固定链接 | 整段复制、翻译转载、图片截取的授权 |
| flows/Dify/、Prompt、archive/ | 无已核实的独立整体许可证；历史资料可能另含第三方材料 | 读取结构，独立写自己的 Schema/实验 | YAML/Prompt/文章/ZIP 内每项的来源和授权；不直接搬整个文件 |
| OPML / RSS 来源表 | 是源链接目录，不等于每个源内容授权 | 研究数据格式、手工选择少量获准来源 | 表本身再分发授权；每个 feed/平台条款和内容权利 |
| images/、文章截图、图标 | 未确认逐项来源/许可 | 本报告不复用图片 | 权利人、是否仅用于宣传/截图、是否允许衍生/分发 |
| 字体/前端资源 | 生产前端未公开，不能做完整资源清单 | 不引入 BestBlogs 字体/品牌资源 | 到实际构建/发行包逐项核验；不能因 CLI 没字体就称全产品字体合规 |
| Dify 插件/运行时/模型 | DSL 指向 OpenRouter 插件 0.0.31（含固定标识），不含插件源与完整许可 | 研究输入/输出协议 | Dify 与该插件实际版本的源码/许可、服务商条款、模型数据政策与地区/费用限制 |

插件依据：[DSL 依赖](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/flows/Dify/dsl/v4/BestBlogs%20%E6%96%87%E7%AB%A0%E5%88%86%E6%9E%90%E6%B5%81%E7%A8%8B.yml#L7-L15)。不能把 Dify 项目名称、云服务条款和独立插件许可证混成一种授权。

## 3. CLI 第三方依赖

只解析已有 package-lock.json，没有 npm install、审计网络调用或执行 lifecycle 脚本。下表是锁文件记录的版本/许可元数据，**不是下载后的完整许可证正文核验**：

| 直接运行依赖 | 锁定版本 | 声明 | 证据 |
| --- | --- | --- | --- |
| commander | 12.1.0 | MIT | [锁条目](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/cli/package-lock.json#L1215-L1223) |
| zod | 3.25.76 | MIT | [锁条目](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/cli/package-lock.json#L3017-L3025) |
| ofetch | 1.5.1 | MIT | [锁条目](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/cli/package-lock.json#L1716-L1732) |
| conf | 13.1.0 | MIT | [锁条目](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/cli/package-lock.json#L1224-L1244) |
| chalk | 5.6.2 | MIT | [锁条目](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/cli/package-lock.json#L1150-L1163) |
| ora | 8.2.0 | MIT | [锁条目](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/cli/package-lock.json#L1742-L1764) |
| prompts | 2.4.2 | MIT | [锁条目](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/cli/package-lock.json#L1896-L1910) |

206 个依赖安装路径条目（包含开发和重复嵌套包），元数据计数：MIT 194、Apache-2.0 3、BSD-3-Clause 3、BSD-2-Clause 1、ISC 4、(MIT OR CC0-1.0) 1；未出现缺失 license 字段的条目。计数不代表 206 个不同项目，也不等于安全漏洞扫描结果。

若日后打包分发这些依赖，需要按实际选用许可证保留正文/版权与必要 NOTICE；Apache-2.0 的 NOTICE 要看上游是否提供，不能只根据一个元数据字段生成空泛声明。开发依赖也应纳入供应链清单。生产服务端的 Java/前端/移动端依赖未公开，无法延伸审计（D）。

## 4. 六种行为的边界

| 行为 | 本轮/下一步处理 |
| --- | --- |
| 学习架构思想 | 可以根据公开材料独立总结，清楚归因，不照搬品牌、长篇文字和资源 |
| 自己重新实现 | 写自己的模型、代码、Prompt 和测试，记录借鉴来源；不要把改变量名当作独立实现 |
| 复制源码 | 先确认具体目录/文件适用许可，再携带版权/完整许可和所需 notices；未知授权先不复制 |
| 修改源码 | 与复制有同样前提，另标明来源/修改，遵守具体许可证；局部 MIT 不覆盖其它目录 |
| 使用第三方 API | 工具许可证不授予服务账户、配额或数据使用权；单独核实实时条款、缓存/导出/商业使用、删除与隐私要求 |
| 转载第三方内容 | RSS 可读/API 可取不等于可全文转载；优先链接原文、自己的短摘要与最少必要引文；图片和付费内容另查授权 |

没有证据就标“需要人工核验”，不凭空宣布所有文件自由使用，也不替作者声明某种未写出的许可证。

## 5. API、抓取与隐私

官方接口 [Key/Pro 说明](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/openapi/README.md#L5-L36)和 [额度表](https://github.com/ginobefun/BestBlogs/blob/756ffbddf5cf4cd87e383a82b7c997563032e93f/README.md#L94-L113)存在，但当前价格、服务条款、转载/批量抓取权限、数据保留政策未在本次环境实时验证（D）。表中数字不能当作长期承诺；协议文档也不是商业使用许可。

迁移准入条件：

1. 获取合法的个人使用权限；不绕过登录、付费墙、平台限制或第三方 robots/来源规则。robots 也不是版权许可证。
2. 最小请求、缓存、速率限制、单源失败隔离；不能直接抓 400 个源来证明能力。
3. 只使用公开、获准、非私密材料；传给模型前去除私人批注、账号和敏感数据。说明供应商是否保留/训练数据。
4. API Key 留在隔离运行环境；不进入 Jekyll、前端 JS、公开仓库、URL 参数或日志。
5. 研究正文作为数据而非工具指令；外部链接不自动成为 shell 命令、工具地址或发布目标。
6. 自动摘要始终保留来源和人工复核状态；源删除/撤稿时能撤下或修正本地公开记录。

## 6. 本轮检查与下一轮检查

本轮研究分支只新增七份 Markdown，不改产品代码/资源/依赖/部署，故没有新的运行时归属通知需要加入现有 notices。离线示例使用 example.test 虚构技术条目和自编 XML，不复制作者正文，也不包含个人信息。

下一轮若实施功能，按本仓库 AGENTS.md 的合规要求补对应迭代报告；有第三方代码/依赖/资源时同步 THIRD_PARTY_NOTICES.md 和完整许可证文件。**授权未确认的 DSL、Prompt、图片和来源表不得因本报告推荐学习就自动纳入产品。**
