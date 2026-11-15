# 第二十九轮验证材料

2026-11-15实际执行。对应[交付记录](../ATLAS-ITERATION-29.md)与
[设计审计](../design-audit-iteration-29.md)，不是模型能力、远端服务可用性
或用户学习成果认证。GitHub CI结果以PR最新提交的Checks为准。

| 材料 | 范围 |
| --- | --- |
| [build-results.txt](build-results.txt) | npm构建/JS与SCSS检查、148项Node检查、真实Jekyll43案例238断言、根/项目路径构建和530内链 |
| [browser-results.txt](browser-results.txt) | 共享模板修正后的31套完整项目路径驱动；根路径选定回归、修正标题及真实Pyodide五例；随后正文/页尾预选修正的两路径专门回归 |
| [runtime-results.txt](runtime-results.txt) | 同一公开API与SQLite ZIP的实际CPython3.12/3.11解压运行、真实HTTP/进程、保存证据语义比对；另实际从预览下载，在新无pip venv照README运行 |
| [hallmark-results.txt](hallmark-results.txt) | 七URL35初轮渲染范围、修正恢复标题后同页五图；不是整个旧CSS源文件的无债证明 |
| [finish-review.txt](finish-review.txt) | 独立终审原始fix1、实际阅读/操作范围、父线程同批修正后resolved；未伪造ship |
| [initial-findings.txt](initial-findings.txt) | 初始CSS格式、首屏/说明布局和漏传localhost例外的原始失败记录 |
| [legacy-css-scope.txt](legacy-css-scope.txt) | 原旧CSS与旧页面扫描的相同历史债，以及Python渲染范围结果 |
| [hallmark-shots/](hallmark-shots/) | 35张最终可审查渲染图，七页面各五种视口/长页；恢复文章使用修正后五图 |
| [screenshots/](screenshots/) | 28版入口、真实中间布局问题、修正结果和实际未知状态；前后关系见交付表格 |

所有浏览器图来自隔离新上下文的公开页面与合成教学状态，无真实私人
学习手记。before页面来自冻结的28/5f29128，不是重新绘制。新的回执页
和恢复文章没有28版对应页面；first是本轮中间状态。375px浅色标题修正
与其before保持同宽，320px两倍根字号另保留结果。图文件名中的宽度不
等于固定长页高度；首屏与全页检查分开。

本轮采用Chromium、390/768/1440、两主题及补充320/375/短桌面检查。
减少动画、键盘、无JS、真实下载和旧38项记录兼容都有实际断言。DOM
文字两倍重排不等于全浏览器缩放。Safari/Firefox、实体机、OS输入法、
机器掉电与网络文件系统未验证。

CLI使用自己新建并清理的临时文件，容器只挂载公开包，禁外网、只读根、
UID10001。没有用户数据库/凭据，也不靠改变量模拟重启。实际恢复JSON
本身在[公开资源](../../assets/examples/agent-restart-case.json)，包含完整
教学故障参数、客户端所收回执和独立观察者；捕获日期不表示新闻或模型
更新日期。

项目现有执行入口为npm run build、npm test、npm run test:atlas、
bash tools/test.sh、npm run test:atlas:browser及npm run test:atlas:python。
额外本机包入口为npm run test:python:api和npm run test:python:restart。
运行Jekyll需要正常Ruby/Bundler环境；普通http.server只托管编译产物。
本轮没有更改这些生产发布配置，也没有自动合并或部署。
