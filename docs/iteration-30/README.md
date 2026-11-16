# 第三十轮验证材料

2026-11-16实际执行。对应[交付记录](../ATLAS-ITERATION-30.md)、
[设计审计](../design-audit-iteration-30.md)及[来源复核](../ml-foundations-source-review.md)。
GitHub远端结果以PR最终提交Checks为准，不把旧候选的通过代替最终代码。

| 材料 | 说明 |
| --- | --- |
| [build-results.txt](build-results.txt) | npm资产构建、项目JS/SCSS及新CSS检查、161项Node、最终真实发布边界/构建/内链/Pages产物检查 |
| [browser-results.txt](browser-results.txt) | 完整命令前32驱动通过、梯度控制台失败；工程修正后的新增项/根路径重跑。最终远端完整34套结果见PR Checks |
| [runtime-results.txt](runtime-results.txt) | 同一公开ZIP在CPython3.12/3.11实际解压运行、从HTTP下载后的新venv执行、两路径真实Pyodide六例 |
| [hallmark-results.txt](hallmark-results.txt) | 两份新CSS与七个正确编译URL的35张实际渲染；标题换行例外与透明次级动作解释 |
| [finish-review.txt](finish-review.txt) | 独立前景终审原始ship0及其实际截图/交互范围 |
| [initial-findings.txt](initial-findings.txt) | 初版样式继承/小数折行、错误扫描调用/测试观察、首次无效缓存性能比较与修正过程 |
| [legacy-css-scope.txt](legacy-css-scope.txt) | 既有样式源债与本轮源字节未变的核对，不冒充整个旧样式表零问题 |
| [performance.json](performance.json) | 4倍CDP CPU下12次同步十步处理器的原始值，以及320px/root32px的实际小数行数 |
| [hallmark-shots/](hallmark-shots/) | 七页面各五张：1280×800、1440×900、1920×1080首屏，1440与375全页 |
| [screenshots/](screenshots/) | 原29轮真实入口、本轮对应入口、初版图例问题、实际修正与文字放大前后 |
| [files-changed.txt](files-changed.txt) | 相对实际29/e991994的完整修改路径，包括本轮证据文件 |

`before-*`为冻结29/e991994页面的真实截图。新的基础地图、回归实验与三篇
笔记没有29版对应页；`first-*`只是本轮中间状态，不是伪造的旧版。入口
对照均为390/1440宽暗色全页；截图高度随真实内容变化。文字放大图是
DOM字号缩放，不等于完整浏览器缩放。截图不包含真实私人学习记录。

新页面覆盖实际操作/下载、axe、控制台错误、同源GET与私有存储访问守卫、
两主题、390/768/1440及补充320/无JS/短屏/文字放大/实时减少动画。原44项
学习记录在两页逐字节/导出保持，只有明确追加五项才成为49项。

回归实际训练一个小的原创合成线性模型；网络例只前向/求导、不更新权重。
这两者都没有调用外部语言模型。原生阅读、真实JS、真实Python、人工故障
夹具与远端服务可用性分别陈述，不是新闻核对、通用框架等价或学习认证。

实际版本为Node24.19.0、CPython3.12.14/3.11.18、现有Pyodide0.27.7及
本机Chromium。没有验证Safari/Firefox、物理手机、OS输入法、全浏览器
缩放或任何真实模型推理。本轮未安装新站点依赖、动效框架或Python SDK。

生产工作流与Pages来源未改，PR不会被自动合并或部署。
