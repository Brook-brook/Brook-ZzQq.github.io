---
layout: atlas
title: 从形状，走到链式梯度
title_keep: 梯度
date: 2026-11-16
category: Machine Learning
kind: tutorial
ai_assisted: true
tags: [AI基础, 神经网络, 张量, shape, 前向传播, 反向传播, BP, 链式法则, tanh, sigmoid, BCE, Python]
summary: 用标准库实际计算2→2→1小网络的前向值与九个参数梯度；看清形状、激活、交叉熵、反传与参数更新的职责。
lab_url: /playground/python/#neural-gradients
download:
  path: /assets/examples/neural-basics.zip
  filename: brook-neural-basics.zip
  label: 下载原创链式梯度练习
  detail: Python3.11+标准库，计算前向与反传；不更新参数，无需安装深度学习框架。
toc:
  - {id: run, label: 先真实运行}
  - {id: shapes, label: 先数清形状}
  - {id: nonlinear, label: 激活改变什么}
  - {id: chain, label: 沿链条求导}
  - {id: update, label: 求梯度与更新参数}
  - {id: sources, label: 来源与边界}
---

在线性回归中，我们直接对`w*x+b`求偏导。多个节点连起来时，可以先
沿计算顺序得到中间值，再把局部导数沿依赖关系传回来。这个例子真正
运行手工前向与反传，说明、逻辑样本、参数和实现均为原创AI辅助材料。

## 先真实运行，再看每一层 {#run}

打开[预选链式梯度的Python实验]({{ '/playground/python/#neural-gradients' | relative_url }})，
明确点击加载Python，再运行代码。首次需要网络下载解释器；示例本身只用
标准库，不安装PyTorch，也不调用模型服务。运行、停止和超时规则与原来的
其他Python例子相同，跳转本身不会执行代码或记录完成。

输出两行JSON，分别是`tanh`与`identity`隐藏层。每行都有当前参数、四个
逻辑XOR例子的前向值、平均二元交叉熵、九个梯度，以及一条链的因子。
这些固定参数**没有更新**，也没有声称训练好了XOR分类器。

也可以下载本文开头的项目，在自己的目录运行：

```sh
python3 demo.py
python3 run_checks.py
```

第一条运行同一份核心函数；第二条用独立中心有限差分等方法核对解析
梯度。检查通过是程序与公式检查，不是你的学习成绩或真实模型能力。

## 先数清形状，再连公式 {#shapes}

一个样本有两个输入`x0,x1`，隐藏层有两个节点`a0,a1`，输出一个logit `s`。
本例参数在±4内，输入在±2内，只支持这一个固定结构。

窄屏可聚焦下表，再用方向键横向查看。

<div class="note-evidence-scroll" role="group" tabindex="0" aria-label="小网络的形状与九个参数，可横向滚动" markdown="1">

| 部分 | 每个样本做什么 | 参数数量 |
| --- | --- | --- |
| 输入 | 两个数 `x0,x1` | 0 |
| 隐藏层 | `zj = wj0*x0 + wj1*x1 + bj`，再求激活 `aj` | 四个w、两个b |
| 输出logit | `s = v0*a0 + v1*a1 + c` | 两个v、一个c |
| 输出与损失 | `p = sigmoid(s)`，与0/1目标比较 | 0 |

</div>

总共九个参数。代码里的`w10`表示第二个隐藏节点连接第一个输入，不是
“第十层”。对四行样本，输入矩阵是4×2；如果把两组隐藏权重按行排成
2×2的`W`，则`Z = X Wᵀ + b`，每行仍有两个隐藏值。这里的转置与广播
来自明确的排列约定，不能见到两个矩阵尺寸相同就随意交换轴。

标量、向量、矩阵是不同阶数的张量；**shape说明各轴大小，不能单独说明
轴的含义**。4×2里的4在这里是样本数，2是输入特征数。把图像高宽、时间
步或通道塞进某一轴时，需要另写约定。本文没有实现通用张量库或卷积。

## 激活，改变的是哪一步 {#nonlinear}

`tanh`把每个隐藏预激活`z`变为`a=tanh(z)`；局部导数为`1−a²`。
切换到`identity`时，`a=z`且导数为1。两种模式都仍在输出端使用sigmoid。

只有仿射隐藏层时，输出logit能折叠为：

```text
s = (v0*w00 + v1*w10)*x0
  + (v0*w01 + v1*w11)*x1
  + (v0*b0 + v1*b1 + c)
```

因此只加一层这样的隐藏变换，不会为logit增加非线性结构。输出sigmoid
本身仍是非线性函数；准确的说法是其固定概率阈值对应仿射logit的线性
边界，不能笼统说整个输出是直线。对输入的仿射形式，也不等于对这组拆开参数的优化必然是凸问题。

本例把两个输入的负/正分别解释为逻辑0/1，四个目标为`0,1,1,0`。
对角两点同类，单一线性边界无法把四点按XOR完全分开。非线性隐藏层
提供不同表达形式，但当前参数没有经过优化，不能据此声称已经解决任务。
这四个逻辑例子全部反复可见，没有独立测试或总体统计推断。

## 沿链条求导，不是跳过中间层 {#chain}

本例用未加权二元交叉熵，平均分母是四个例子：

```text
单个例子：ℓ = −y*log(p) − (1−y)*log(1−p)
整体目标：L = (ℓ0 + ℓ1 + ℓ2 + ℓ3) / 4
```

程序从logit直接稳定计算损失，避免先把概率舍入为0或1再取对数。
sigmoid与该损失合起来，对logit的导数可化为`p−y`。
对一个例子的`w00`，沿依赖关系依次经过：

```text
ℓ → s → a0 → z0 → w00

该行对平均梯度的贡献：
(p−y) * v0 * (1−a0²) * x0 * (1/4)
```

输出的`chain_w00`保留这五个实际因子，其乘积对应该行
`mean_gradient_contribution.w00`。再把四行加起来，才得到
`mean_gradient.w00`。同样规则算出其余八项；不能只拿某一行代表整个目标。
identity模式将隐藏层导数换为1，其余依赖关系仍然需要保留。

某个隐藏值饱和时，`1−a²`会很小，说明这条链的局部梯度可能变弱。
这只是一个小结构的观察，不能凭此概括所有深层网络的训练稳定性。

## 求梯度，与更新参数分开 {#update}

这份代码只求当前点的梯度，`parameters_updated`明确为false。
连续运行相同参数时会得到新的同值计算，不会偷偷训练，也不会把上一轮
梯度再次加上。改变参数草稿并重新运行，是你手动提供了另一个计算点。

若进一步训练，还需要选择优化器与设置，再更新参数。已有
[线性回归实验]({{ '/playground/linear-regression/' | relative_url }})展示了真实的
全批量更新；这里帮助理解一个更长的函数怎样求梯度。

PyTorch的`backward()`通常向需要梯度的叶子张量`.grad`累加，参数更新由
优化器等后续操作负责；中间张量也有专门的保留/求导方式，并非永远不能
拿到梯度。本文的固定手工函数没有实现自动微分图、`.grad`语义或优化器，
不能把运行它说成调用了PyTorch。

神经网络的前向/反传也不同于[Agent循环](../agent-loop-basics/)的
“提议、执行、观察”：后者组织应用动作，不会因循环多跑几次就自动训练
模型参数。概率、训练损失、工具回执和最终任务是否可靠，各需对应证据。

到[链式梯度自检]({{ '/study/practice/#neural-chain-rule' | relative_url }})，
解释这五个因子、平均分母和参数未更新的含义。回到
[AI基础学习地图]({{ '/study/ai-foundations/' | relative_url }})时，CNN、RNN与
微调等后续主题仍有各自明确的缺口，不把这一个小网络当成完整课程。

## 实际阅读来源与边界 {#sources}

2026-11-16实际对照固定公开版本：

- [PyTorch Tutorials：Automatic Differentiation](https://github.com/pytorch/tutorials/blob/5277794075fd393cf24f139ac978f96bc06b5aa3/beginner_source/basics/autogradqs_tutorial.py)：全文，前向计算图、链式法则与梯度累加的基础；没有复制其代码、图示或参数。
- [PyTorch：BCEWithLogitsLoss文档段](https://github.com/pytorch/pytorch/blob/2a2d844941bf776d1a49a8ff8730e90f5242f836/torch/nn/modules/loss.py)：未加权二元损失、reduction与稳定计算。其他损失实现没有在本例复现。

两仓库的实际完整LICENSE也已阅读。PyTorch未安装或随包分发；原创
标准库实现只解释这个固定结构，浮点、通用自动微分和框架兼容性另有范围。
