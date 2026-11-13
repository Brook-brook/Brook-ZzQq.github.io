# 第十四轮资源、来源与隐私核对

2026-11-13。基线 3274e30；AI 评测教学实验与原创教程。

- 未增加/升级任何运行或开发依赖，package-lock 不变；使用原生 JS/CSS/SVG、
  既有 Jekyll 和浏览器测试。无新字体、图片、地图、真实地点数据或外部服务。
- 20 条分数与三个标签场景为原创合成数据，版本 atlas-synthetic-evaluation-v1。
  无真实人物、地理位置或模型推断；不声称训练/验证了实际 AI，分数不是概率。
- 指标定义/分母、阈值与测试隔离核对 scikit-learn 官方提交
  7b2b14e0a89eedfa514dc9885e35a0ecade20cd0 的 model_evaluation.rst、
  classification_threshold.rst、common_pitfalls.rst。实际读取其 COPYING：
  BSD-3-Clause，Copyright 2007–2026 The scikit-learn developers。
  仅引用概念/标准公式与来源链接，没有复制上游代码、图表或文档文件，也不
  引入该库；既有许可证保留。不是上游背书或 Brook 已复现实验的声明。
- 教程披露 AI 辅助整理；手算例子由独立模型测试核对，缺分母显示未定义。
  核对源码/数学不等于真实模型性能评估或权威新闻核查。
- 参数只在页面内存；无 localStorage、查询 URL、表单提交、模型调用或数据
  上传。导出仅在明确点击时生成含 20 条公开合成样本与参数的本机 JSON，
  不读取/包含私人学习手记、观察台记录或主题/收藏数据。
- 新 JSON/数据 ID 与客户端/真实 Jekyll 校验有界、唯一、类别比例一致；
  未改变既有研究发布、记录格式或永久步骤 ID。原内容与功能保留。
- 复用本地原创 Mote，截图来自实际页面；没有新增个人经历、联系信息或
  学习成就。生产 Pages/默认分支/生产工作流不变，不自动合并或部署。

THIRD_PARTY_NOTICES.md 同步记录本轮无新增分发依赖及来源范围。测试与
浏览器限制见 [本轮交付](ATLAS-ITERATION-14.md)。
