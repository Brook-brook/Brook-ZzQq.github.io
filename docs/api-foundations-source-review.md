# 接口基础：来源与实际运行范围

2026-11-15。本次实际核对的来源、原创实现与测试分开记录。
不把资料可访问、HTTP200、程序检查通过或本机演练称作模型能力。

## 固定来源

| 来源 | 实际阅读范围 | 在本项目中的用途 |
| --- | --- | --- |
| [CPython3.11.18](https://github.com/python/cpython/tree/26badd80b6dc7786cd8fb63c3608a31f04754219/Doc/library) `26badd80b6dc7786cd8fb63c3608a31f04754219` | json.rst的转换表、hooks、编码、NaN/Infinity与重复名称；http.client.rst的阻塞操作timeout；http.server.rst的本机服务与生产限制；http.rst状态枚举 | 原创JSON契约、实际loopback客户端/服务和范围说明 |
| [HTTPWG/http-core RFC9110](https://github.com/httpwg/http-core/blob/bde37f634681bd5462568b73aa722af9c9a3ef5e/rfc9110.xml) `bde37f634681bd5462568b73aa722af9c9a3ef5e` | 8.6 Content-Length、9.2.2幂等、10.2.3 Retry-After、15.3.5 204，以及实际版权声明 | 区分HTTP成功、应用所需正文、重试建议与重复请求的预期效果 |

RFC9110在2022年发布。固定仓库版本不是“2026年新HTTP标准”；来源核对
日期也不代表对任意模型API的最新行为做了测试。GitHub连接工具无法承载
长HTML时，使用原有网络规则下的官方固定raw文件读取，没有绕过TLS或代理。

## 原创实现与有意收窄的契约

`json_contracts.py`只用标准库。`decode_json_document`处理文本、UTF8字节
上限、重复名称和非标准数策略；`analyze_json_request`才要求精确字段、
整数版本、sum任务与有限数列表。解析`true`能得到bool，不表示它能通过
本应用的数值契约。1e309与NaN在不同层被拒绝。这里不是通用JSON Schema
实现、token计数器、输入来源认证或通用日志脱敏器。

`http_client.py`只请求127.0.0.1已知GET路径，每次显式一次，不自动重试
或跟随302。检查状态、媒体类型、UTF8/未压缩表示、2048字节上限、实际
正文长度与同一应用契约。204案例实际没有Content-Length；本应用仍需要
JSON时报告expected_json_absent，不把它叫传输失败。Retry-After保留短原值，
未解析日期，也不据此等待或重新请求。socket timeout不是整项任务截止。

`delivery_http.py`实际POST/查询本机单进程内存接收端。Idempotency-Key是
这个服务自己实现的契约，不能推定所有POST或公开API都支持。单进程锁
覆盖此处计数与回执缓存，不能推导出持久化、跨服务事务、认证或分布式
恰好一次。首回在应用前/后主动断开是故障注入，不是公网超时测量。

客户端区分写入/查询回执角色，并核对响应表示、key、参数和历史值形状。
收到错误角色、坏类型或错配回执时不能确认，接收端可能已经增加；这份
未知不能被改成“没有执行”。返回旧回执也不表示得到最新总值。

JS和Python只共享小整数接收端的教学规则，另有126步实际数值/回执对照。
网页执行内存JS，没有HTTP写入；下载项目才实际运行loopback sockets。
这些对照不是SDK兼容、模型推理、互联网服务可用性或性能基准。

## 实际运行证据

- 当前15-entry公开ZIP按显式输入逐项核对，包含14个源/许可文件与MANIFEST。
- Python3.12.14实际解压ZIP，隔离模式执行20项标准库检查，以及4个JSON、
  11个GET和6个POST/查询情景；断开、阻塞超时、并发同key和坏回执均实际
  经过本机HTTP，不只检查源码或预写输出。
- 同一ZIP在Python3.11.18、UID10001、禁外网、只读根容器中再次实际执行，
  通过`-I -S -B`禁用site与外部Python路径；只挂载公开ZIP，没有模型凭据。
- 原四个项目ZIP的字节保持不变，原GIS目录来源/日期/ODbL归属不变。
- 浏览器JSON预选只选择源码，显式加载现有Pyodide后才执行。浏览器真实
  解释器、原生JS实验与本机Python/HTTP各有独立验证，不相互冒充。

最终命令、日志和界面验证见[第二十九轮交付](ATLAS-ITERATION-29.md)。

## 许可处理

程序、教学数据、中文讲解和检查均为Brook原创AI辅助材料，MIT。没有复制
上游实现、规范代码、课程、图片、账户资料或第三方distribution。
完整实际`licenses/CPython-LICENSE.txt`随ZIP保留，包括PSF、历史与文档
示例条款；不把CPython资料重许可为MIT。

RFC的实际版权为2022 IETF Trust及文档作者，受BCP78/IETF Trust Legal
Provisions约束；抽取Code Components另适用Revised BSD要求。这里仅作
事实参考与原创解释，没有转存规范文本或代码，也没有将整份RFC标为MIT。
详见[本轮合规记录](iteration-29-compliance.md)。
