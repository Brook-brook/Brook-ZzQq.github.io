---
layout: atlas
title: 换一个区域，模型成绩还说明什么？
date: 2026-11-13
category: GIS × AI
kind: tutorial
ai_assisted: true
tags: [GIS, AI, kNN, 空间验证, 留出测试, 数据划分, 外推]
summary: 用同一组自编点运行邻居分类，对照随机留出与整区留出，区分任务目标、覆盖距离、类别比例和评估边界。
lab_url: /playground/spatial-validation/
toc:
  - {id: target, label: 先问预测目标}
  - {id: method, label: 实验真正算什么}
  - {id: evidence, label: 沿邻居核对预测}
  - {id: counterexample, label: 一个反例}
  - {id: limits, label: 使用边界}
  - {id: sources, label: 来源与核对范围}
---

本笔记由 AI 辅助整理，概念对照文末固定版本的官方项目文档。80 个点、
标签和实验实现均为本项目原创合成教学内容，不是现实校园数据或模型评测。

## 先问：在哪里预测？ {#target}

同样是“未参与训练的点”，可能指已经采样区域内的一个新位置，也可能指
整片没有采样的新区域。两者对已有空间覆盖的依赖不同。划分方式应该尽量
反映实际预测目标，而不是挑一个更好看的成绩。

随机划分并不自动构成泄漏；空间划分也不自动保证公正或适合所有任务。
关联对象、时间、预处理和参数选择都需要根据真实使用场景检查。

## 这个实验真正算什么？ {#method}

固定的 80 个二维点，落在 `[0, 800] × [0, 800]` 的合成平面。单位只记为
`synthetic-m`，没有 CRS、经纬度或现实长度校验。四个区各有 20 个点：
A 左下、B 右下、C 左上、D 右上。两套标签使用相同点位：

- 区域标签：A、D 中的点为 1，其余为 0。
- 对角线标签：`x + y >= 800` 为 1，其余为 0。

均匀权重 kNN 保留 60 个训练点。对每个测试点，用欧氏距离排序，取最近的
k 个训练点，正例票数过半就预测为 1。界面只给奇数 k 以避免二分类投票
平局；距离并列按 ASCII ID 排序。投票比例不是校准概率。

两种协议各留出 20 点：种子控制的随机留出，和选择一整区的留出。这里
每次只运行一次，不是对所有折求平均的交叉验证。改种子只改随机分组，
不会重新生成坐标或标签；改留出区不会改变随机组。

## 沿一个样本核对证据 {#evidence}

默认区域标签、k = 3、种子 42、留出 A 区：

| 协议 | 测试正例 | 准确率 | 平均最近训练点距离 |
| --- | --- | --- | --- |
| 随机留出 | 9 / 20 | 90% | 74.36 synthetic-m |
| 整区留出 A | 20 / 20 | 0% | 183.54 synthetic-m |

选随机组的 S03，它的三个邻居是 S11、S04、S02。再选整区组的 S01，
邻居为 S05、S41、S42，全部来自训练集。预测函数只接收查询坐标和训练标签；
测试真实标签在预测结束后才进入混淆矩阵计算。

距离是对采样覆盖的描述，不是置信度或误差上界。两个测试集类别比例也
不同，不能把上表差异全部归因于“空间因素”，更不能据此估计真实模型效果。

## 反例：空间留出不一定更差 {#counterexample}

保持 k = 3、种子 42、留出 A，改成对角线标签：随机组准确率为 90%，
整区组为 100%。但整区 A 的 20 个测试点全为 0，召回率分母为零，应显示
未定义；这个 100% 不能说明“已学会识别新区域的正例”。

这个反例既不证明空间划分更好，也不否定区域外推评估。它提醒我们检查
标签结构、测试构成、覆盖与实际目标，不把一个数字当作通用排名。

## 从沙盒走向真实工作 {#limits}

先写部署目标，再设计划分。真实地理任务还需要核对 CRS、尺度、时间、对象
重复与采样偏差；本实验的欧氏距离不适用于直接把经纬度当米计算。空间
分组或缓冲距离也没有对所有数据都适用的固定选择。

预处理拟合与调参应留在训练/验证流程内。反复查看本页结果是教学探索，
不是独立测试。真实报告应说明完整数据来源、分组规则、指标分母、基线和
不确定性；必要时进行多次划分或符合目标的交叉验证，不能从一次留出外推。

可以继续读[指标分母](../ai-evaluation-basics/)和[AI 材料证据阅读](../reading-ai-evidence/)，
也可以在[学习路线](../../study/paths/#ai-spatial-evidence)留下自己的解释。

## 来源与核对范围 {#sources}

2026-11-13 读取并核对：

1. [scikit-learn：Nearest Neighbors](https://github.com/scikit-learn/scikit-learn/blob/7b2b14e0a89eedfa514dc9885e35a0ecade20cd0/doc/modules/neighbors.rst)，均匀权重邻居分类。
2. [scikit-learn：Cross-validation](https://github.com/scikit-learn/scikit-learn/blob/7b2b14e0a89eedfa514dc9885e35a0ecade20cd0/doc/modules/cross_validation.rst)，分组验证与使用假设。
3. [scikit-learn：Common pitfalls](https://github.com/scikit-learn/scikit-learn/blob/7b2b14e0a89eedfa514dc9885e35a0ecade20cd0/doc/common_pitfalls.rst)，训练/测试隔离与数据泄漏。
4. [mlr3spatiotempcv README 与 FAQ](https://github.com/mlr-org/mlr3spatiotempcv/blob/f97b5b0ef4e6b480a861fe0d724307313579e417/README.md)，划分应反映预测目标，没有普遍最好的方法。

仅参考概念，没有复制上述项目代码、图片或数据，也没有引入其运行依赖。
