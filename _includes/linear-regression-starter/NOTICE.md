# 来源与许可

gradient.py、demo.py、run_checks.py、说明与samples.json由Brook项目原创，
AI辅助编写，MIT License，完整文本见LICENSE.txt。没有复制第三方算法
实现、课程代码/图片/全文、数据集、模型权重或网页正文。

2026-11-16实际阅读scikit-learn固定提交
1a16a519abd16444af692c841e314d32a3b52a29的以下相关段落，作为方法事实参考：

- doc/modules/linear_model.rst：普通最小二乘介绍与目标。
- doc/modules/sgd.rst：简介、学习率与特征尺度说明。
- doc/modules/cross_validation.rst：开头的训练/验证/测试与留出预处理。
- COPYING：BSD3-Clause全文。仅阅读，不打包其代码、图示、数据和文档段落。

固定源码：https://github.com/scikit-learn/scikit-learn/tree/1a16a519abd16444af692c841e314d32a3b52a29
scikit-learn不是本项目依赖，本算法是全批量梯度下降而不是其SGD优化器。
不声称第三方认可、最新性能、课程覆盖或任何模型服务已经调用。

运行需要用户自备CPython3.11+；解释器及标准库不在ZIP中分发。完整
CPython许可与历史声明保留在licenses/CPython-LICENSE.txt（既有官方3.11.18
文本）；参考授权与本地可运行性不等于Python基金会背书。
