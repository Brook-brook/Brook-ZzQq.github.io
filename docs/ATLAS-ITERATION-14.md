# 第十四轮：能逐条核对的 AI 评测实验

2026-11-13（Asia/Shanghai）。基于第十三轮 3274e30，开发分支
feat/atlas-iteration-14；PR 基线 feat/atlas-iteration-13 尚未合并。
本轮是连续三轮学习生态迭代的第一轮，后续范围见
[整体计划](iterations-14-16-plan.md)。没有自动部署或合并。

## 实际交付

`/playground/evaluation/` 提供 20 条原创合成样本，三个明确的标签场景。
用户能用原生键盘/触控阈值控制查看混淆矩阵、准确率、精确率、召回率、F1，
按 TP/FP/FN/TN 核对样本，比较全阴性基线，并下载完整的本次实验 JSON。

默认稀有场景阈值 50：TP=1、FP=9、FN=1、TN=9，准确率 50%、精确率10%、
召回率50%、F1约16.7%。阈值100：准确率90%，却漏掉全部正例。没有分母
显示未定义，和数值零区分；F1 直接按混淆矩阵计算，基线不伪造新源分数。

新增原创教程“先看错在哪里，再看准确率”，把实验接到 AI 报告阅读方法、
Playground、Study、Projects 实现说明和公开搜索。当前 9 篇公开笔记、
34 个公开搜索入口；原四条路线/九个永久步骤 ID 与私人存储格式保持。

## 概念与来源

本机真实计算的是自编数据的数学结果，没有采集个人/校园数据、训练真实
模型、模拟调用大模型或宣称真实性能。分数不是校准概率，不自动决定错误
成本，反复探索教学阈值也不是独立测试。教程披露 AI 辅助整理。

实际核对 scikit-learn 提交 7b2b14e0a89eedfa514dc9885e35a0ecade20cd0 的
model_evaluation、classification_threshold、common_pitfalls 文档及 COPYING。
标准公式与测试隔离说明引用原始链接，没有复制上游实现/图表或引入该库。
来源/许可与隐私范围见 [本轮核对](iteration-14-compliance.md)。

## 浏览器发现与修正

最初本地旧预览服务未运行，启动独立服务后实际检查，未把未打开的页面
当作视觉验收。axe 找到手机样本表的键盘滚动问题：已补原生 focusable region
及可访问名称，并真实用 ArrowRight 检查横向滚动。表格滚动不扩展页面宽度。

第一张实拍还显示控件离结果较远；已把实时 TP/FP/FN/TN 放到阈值旁，缩短
重复说明、改善面包屑间距、补表格横向滚动提示。一次 light-glass 控制条、
矩阵与平铺指标、按实际标签分形状的分数图延续奶紫/深紫，没有新动效库、
持续动画、假计数或过量玻璃卡片。

| 状态 | 实际截图 |
| --- | --- |
| 初版手机 | [控件和反馈相隔较远](iteration-14/screenshots/first-390-dark.png) |
| 修正后 | [手机深色](iteration-14/screenshots/default-390-dark.png) |
| 矩阵与分母 | [桌面浅色](iteration-14/screenshots/matrix-1440-light.png) |
| 无正例/无预测 | [未定义指标](iteration-14/screenshots/undefined-390-light.png) |

## 验证

| 检查 | 实际结果 |
| --- | --- |
| npm run build / npm test | 资产构建、ESLint、SCSS 通过 |
| npm run test:atlas | 69 项通过；手算矩阵、边界/null、全部阈值守恒/单调性、不变性、数据约束与可复现实验 |
| bash tools/test.sh（Ruby 3.3 容器） | 22 个真实 Jekyll 场景/123 断言；47 HTML、212 内链通过 |
| 完整浏览器命令 | 主站、地图、旧实验、Study、学习记录、观察台、研读室、搜索及新评测通过 |
| 根路径构建/内链/新实验套件 | 47 HTML、212 内链和同一新实验全套通过 |
| 真实 Pyodide | 三示例、异常、输出上限、死循环超时、重载/停止通过 |
| 两种路径的 check-pages-build.mjs | 渲染布局、首页本地资产、主要路由和旧 bundle 通过 |

新实验覆盖 390/768/1440 × 双主题、axe、无横向页面溢出、真实 End/Home
阈值操作、场景/行过滤、零与未定义、真实 JSON 下载、私人 key 保持原样、
无模型/外部数据请求、无页面异常/资源404、无 JS 默认20条样本与公式。
真实 Jekyll 另外拒绝错误版本/重复ID/越界分数/虚假场景比例，不仅靠客户端。

浏览器验收使用 Chromium。Safari/Firefox、真实手机键盘与读屏未实测，axe
不是完整无障碍认证；合成数学测试也不代表任何实际 AI 已获验证。
原始证据：[构建](iteration-14/build-results.txt)、[浏览器](iteration-14/browser-results.txt)。

## 预览与主要文件

CI 的 build (3.3) 下载 atlas-review-preview 编译产物，解压后在包含
Brook-ZzQq.github.io 子目录的那层运行 `python3 -m http.server 8000`，打开
http://127.0.0.1:8000/Brook-ZzQq.github.io/playground/evaluation/ 。
源码 ZIP 仍需 Jekyll 编译，不能直接作为这个预览。

核心文件是 evaluation-models.js、evaluation.js、evaluation.css、合成数据 JSON、
Jekyll 数据护栏、新页面/笔记和对应模型/浏览器/真实构建测试。实现状态、
入口、设计与资源记录同步更新。下一轮把这些指标用于真实原生 kNN 的空间
留出对照，再连接到同一个私人学习工作台。
