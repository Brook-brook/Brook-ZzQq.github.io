---
layout: atlas
title: 先看错在哪里，再看准确率
date: 2026-11-13
category: AI 评测
kind: tutorial
ai_assisted: true
tags: [AI, 混淆矩阵, precision, recall, F1, 阈值, 类别不平衡]
summary: 用 20 条合成样本核对分类阈值、误报与漏报，理解指标的分母和独立测试的边界。
lab_url: /playground/evaluation/
toc:
  - {id: question, label: 先问评测问题}
  - {id: matrix, label: 样本与混淆矩阵}
  - {id: denominators, label: 四个指标的分母}
  - {id: boundary, label: 未定义与阈值边界}
  - {id: independent, label: 留出独立测试}
  - {id: sources, label: 来源与核对范围}
---

本笔记由 AI 辅助整理。定义与边界对照文末固定版本的 scikit-learn 官方
文档；算例使用本项目自编合成样本，没有测量任何真实 AI 的性能。

## 先问评测问题 {#question}

“准确率很高”缺少任务、样本、类别比例、阈值与错误代价。对稀有事件，
一直预测“没有发生”也可能有很高的准确率，却不能找出任何关注事件。

先写下四件事：关注的正类是什么？哪些样本代表未来使用场景？怎样把分数
变成决策？误报和漏报分别带来什么影响？指标服务于这些问题，不替代它们。

## 20 条样本怎样组成矩阵 {#matrix}

打开本实验的“稀有正例”场景：20 条样本中有 2 条标签为 1，其余为 0。
分数是自编的 0–100 数值，不是概率，也不是模型训练输出。规则是：

```text
score >= threshold → 预测 1
score < threshold  → 预测 0
```

阈值 50 时，10 条被判为 1，其中只有 1 条是真正的正例。因此：

| 实际 / 预测 | 预测 1 | 预测 0 |
| --- | --- | --- |
| 实际 1 | TP = 1，正确识别 | FN = 1，漏报 |
| 实际 0 | FP = 9，误报 | TN = 9，正确排除 |

每一条都能在实验表格里核对。四格总和等于样本数，不能只报一个百分比。

## 四个指标，四次看分母 {#denominators}

- **准确率** `(TP + TN) / N = 10 / 20 = 50%`：所有样本中分对的比例。
- **精确率** `TP / (TP + FP) = 1 / 10 = 10%`：预测为正的样本里有多少真是正例。
- **召回率** `TP / (TP + FN) = 1 / 2 = 50%`：所有真实正例里找回了多少。
- **F1** `2TP / (2TP + FP + FN) = 2 / 12 ≈ 16.7%`：结合精确率与召回率，
  仍不包含 TN，也不自动体现业务中不同错误的代价。

若全部预测 0，这个场景的准确率是 `18 / 20 = 90%`，召回率为 0。可见
不同指标在回答不同问题；不能从准确率单独推断“有效发现了稀有事件”。

## 未定义不是零；阈值也不是万能旋钮 {#boundary}

没有预测正例时，精确率的分母为 0；样本没有真实正例时，召回率的分母为 0。
本实验把这些值显示为“— / 未定义”，而不是擅自填零。F1 直接按混淆矩阵
计算：若 `2TP + FP + FN` 为 0，它也未定义；若存在漏报但 TP 为 0，F1 可为 0。
库实现可能提供 `zero_division` 等配置，复现实验时需记录具体约定。

降低阈值会增加或维持预测正例数，召回率在有真实正例时不会下降。但精确率
不保证单调；新增预测可能是真例，也可能是假例。改变类别比例也会改变指标。
三个合成场景不是对现实流行率变化的因果实验，也没有估计部署环境表现。

## 先选参数，再留出独立测试 {#independent}

当前页面是可反复探索的教学沙盒。真实工作通常应先约定任务与指标，在
训练/验证资料中选择模型与阈值，把最终测试资料留作独立评估。不要把测试
标签用于训练、预处理拟合或一次次调参后仍宣称它是未见过的测试。

空间或时间数据还可能有关联：同一地点附近、同一对象或相邻时间的样本，
怎样划分才对应未来的使用场景？可以在[空间验证实验](../../playground/spatial-validation/)
中，用同一组点对照随机留出与整区留出。

## 来源与核对范围 {#sources}

2026-11-13 核对 scikit-learn 官方仓库提交
`7b2b14e0a89eedfa514dc9885e35a0ecade20cd0`：

1. [Model evaluation：precision、recall、F-measures 与 zero_division](https://github.com/scikit-learn/scikit-learn/blob/7b2b14e0a89eedfa514dc9885e35a0ecade20cd0/doc/modules/model_evaluation.rst)
2. [Classification threshold：分类分数与决策阈值](https://github.com/scikit-learn/scikit-learn/blob/7b2b14e0a89eedfa514dc9885e35a0ecade20cd0/doc/modules/classification_threshold.rst)
3. [Common pitfalls：数据泄漏与训练/测试隔离](https://github.com/scikit-learn/scikit-learn/blob/7b2b14e0a89eedfa514dc9885e35a0ecade20cd0/doc/common_pitfalls.rst)

这里只引用定义并给出原创算例，没有复制官方代码或图表。代码核对、数学
算例与教学数据均不构成对真实模型或公共新闻的事实核查。
