---
layout: atlas
title: 让梯度真正更新一条直线
title_keep: 更新
date: 2026-11-16
category: Machine Learning
kind: tutorial
ai_assisted: true
tags: [AI基础, 梯度下降, 线性回归, 学习率, MSE, full batch, SGD, Python]
summary: 从训练MSE求两个偏导，同时更新斜率与截距；比较学习率、数值停止和训练之外的误差。
lab_url: /playground/linear-regression/
download:
  path: /assets/examples/linear-regression-starter.zip
  filename: brook-linear-regression.zip
  label: 下载原创梯度练习
  detail: 本机Python3.11+，仅标准库；真实计算一元线性回归，无需模型Key。
toc:
  - {id: first, label: 复算第一步}
  - {id: gradient, label: 为什么沿这个方向走}
  - {id: rate, label: 步幅与稳定性}
  - {id: evidence, label: 记录实际发生的更新}
  - {id: local, label: 在自己的Python运行}
  - {id: sources, label: 来源与边界}
---

先读[任务、特征与损失](../ml-task-loss/)，再打开
[直线与梯度实验]({{ '/playground/linear-regression/' | relative_url }})。
这里真正用8个训练点更新参数；没有调用语言模型或外部服务，也没有用
预写动画冒充训练。公式、教学数据和实现由本站独立编写，AI辅助整理。

## 先复算第一步 {#first}

默认起点`w=0,b=0`，学习率`η=0.05`。先展开原始样本表，再点击“走一步”。
这一步使用旧参数算出梯度：

```text
∂L/∂w = −29.7
∂L/∂b = −2.125

w_new = 0 − 0.05*(−29.7)  = 1.485
b_new = 0 − 0.05*(−2.125) = 0.10625
```

“完整步骤”表保存这次实际使用的学习率与梯度，下载记录还保留更新前
参数和完整精度。界面为可读性做了小数格式化；复算请用下载中的数字，
而不是把显示的5位小数继续当作精确输入。

## 为什么沿负梯度方向走 {#gradient}

对固定训练样本，定义`rᵢ=w*xᵢ+b−yᵢ`。训练MSE为`Σrᵢ²/n`，所以：

```text
dw = (2/n) * Σ(rᵢ*xᵢ)
db = (2/n) * Σrᵢ
(w_new,b_new) = (w,b) − η*(dw,db)
```

两个偏导都在**同一组旧参数**下计算，再同时应用；不能更新`w`后
拿新`w`去算本步`db`，否则变成另一个算法。负梯度是局部最快下降方向，
但有限步长可能越过低点；并不保证任意学习率每步都降低损失。

在图下展开“拆开一个样本”，选择一个训练点：它对当前训练MSE的贡献
是`r²/8`，对两个梯度的贡献分别是`2*r*x/8`与`2*r/8`。累加8个训练点
才得到当前完整目标和梯度；选择某一点不会把全批量更新换成单点更新。
改选验证点时，只显示它对验证MSE的`r²/4`贡献，训练梯度明确不适用。
这是**当前参数**的解释，不要混成最近一次历史更新前的梯度。

本实验每一步遍历全部8个训练点，所以是**全批量梯度下降**。
SGD通常按单个样本或小批次更新，噪声、更新次数和学习率安排会不同。
这里也没有神经网络层与反向传播图，不能把两项手工偏导当成完整BP实现。

## 步幅，为什么会改变稳定性 {#rate}

先重开默认起点。比较`0.05`与`0.2`，各走若干步，观察参数、训练MSE
和拟合线。不要只看验证曲线替学习率做最终结论。

对这组特定训练点，特征均值为0，损失Hessian的两个特征值是15与2。
固定学习率满足`0 < η < 2/15`时，这个正定凸二次问题的参数迭代收敛。
这里“收敛”是数学条件，不是网页根据一段平滑曲线给出的认证。

在斜率方向，误差每步乘`1−15η`；截距方向乘`1−2η`。
因此`η=0.05`分别是0.25与0.9；`η=0.2`的斜率误差每步乘−2，
会交替放大。特征尺度、损失是否含`1/2`、参数化和优化器都会改变界限，
**这个数不能迁移为神经网络的通用学习率**。

训练点的最小二乘参考解是`w=1.98,b=1.0625`，训练MSE为
`0.04184375`。它直接由训练点的均值、方差与协方差算出，没有使用
验证标签；参考虚线只是帮助核对优化结果，不是现实规律或泛化基准。
scikit-learn的`LinearRegression`也不等于这里的手写迭代实现。

为了让本机实验保持有界，最多应用120次更新。若拟议参数绝对值超过
`1e6`或拟议训练MSE超过`1e12`等数值边界，该步不会应用，最后正常
状态仍可下载。记录中保留被拒绝的拟议值与原因。它们是教学保护，
不是自动选择最佳模型、验证早停或发散的完整数学判据。

## 让记录对应实际发生的事 {#evidence}

学习率只作用于下一次点击；改输入不会重写历史。初始参数也只有点击
“用起点重开”才生效。空输入和超范围值不会偷偷换成默认值。点击
“连走10步”执行最多10次更新，遇到边界就停，不补写未执行步骤。

散点图只显示固定观察窗，越界直线会被裁切。损失图使用
`log10(1+MSE)`轴，便于同时看清小损失和放大的损失；刻度不是原始MSE，
完整表与下载始终保留原始值。圆点与方点区分训练/验证，曲线以实线与
虚线区分，不只依靠颜色。

下载的JSON包含原创样本、起点、逐步参数、梯度、实际学习率、两类损失
和停止原因。不包含学习手记或自动完成状态；未应用的输入草稿也不冒充
已经运行的设置。这份计算记录不能证明发布者身份或真实数据质量。

验证标签没有进入梯度、参考解与数值停止，但你反复看见它们，仍然不能
称它们为独立最终测试。比较结果时，分开描述训练优化、验证观察和
尚未验证的现实用途。

可在[梯度更新自检]({{ '/study/practice/#ml-gradient-update' | relative_url }})
写下第一步的计算；再解释[学习率]({{ '/study/practice/#ml-learning-rate' | relative_url }})
与[留出边界]({{ '/study/practice/#ml-validation-split' | relative_url }})。

## 在自己的Python运行 {#local}

下载本文开头的原创梯度练习，解压进入`brooks-linear-regression`目录：

```sh
python3 demo.py
python3 demo.py --case stable
python3 demo.py --case oscillating
python3 demo.py --case guarded
python3 demo.py --case mixed
python3 run_checks.py
```

只需Python3.11+标准库，无需pip或模型账号。第一条真正运行一次更新，
其他四条分别使用固定的稳定、交替放大、数值边界和混合学习率设置。
`--case all`会输出全部五份实际JSON记录；完整公式与文件职责在包内README。
网页和Python使用同一份公开样本，Python独立用`math.fsum`求和；检查数值
容差与实际停止原因，不承诺逐位相同或导入其他框架。这个项目不会自动
读取网页导出或学习手记，也不会打开网络服务。

## 实际阅读来源与边界 {#sources}

2026-11-16对照scikit-learn固定提交
`1a16a519abd16444af692c841e314d32a3b52a29`：

- [Linear Models：Ordinary Least Squares](https://github.com/scikit-learn/scikit-learn/blob/1a16a519abd16444af692c841e314d32a3b52a29/doc/modules/linear_model.rst)：线性模型与残差平方目标。
- [Stochastic Gradient Descent：简介和学习率/缩放说明](https://github.com/scikit-learn/scikit-learn/blob/1a16a519abd16444af692c841e314d32a3b52a29/doc/modules/sgd.rst)：优化方法与模型类别不同，学习率和尺度需要分清；本文不是其SGD复现。
- [Cross-validation：开头与留出预处理段落](https://github.com/scikit-learn/scikit-learn/blob/1a16a519abd16444af692c841e314d32a3b52a29/doc/modules/cross_validation.rst)：验证与最终测试的区别。

没有复制上游实现、图片或数据集，没有新增模型服务和动画库。
教学大纲帮助确定基础主题，独立编写的材料用于自学；章节线索不等于完整课程覆盖。
