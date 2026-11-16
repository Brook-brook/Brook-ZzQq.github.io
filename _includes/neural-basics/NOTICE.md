# 实际来源与未分发范围

本包neural.py、demo.py、run_checks.py、说明、九个参数与四个逻辑XOR例子
均为Brook项目原创AI辅助教学材料，按MIT发布。没有复制上游实现、课程
代码、图示、模型权重或第三方数据集。

2026-11-16实际阅读：

- pytorch/tutorials 5277794075fd393cf24f139ac978f96bc06b5aa3：
  beginner_source/basics/autogradqs_tutorial.py全文及LICENSE全文。
  参考前向图、链式求导和梯度累加的概念，没有复制原代码、图片与参数。
  教程许可为BSD3-Clause，实际版权2017–2022 Pytorch contributors。
- pytorch/pytorch 2a2d844941bf776d1a49a8ff8730e90f5242f836：
  torch/nn/modules/loss.py中BCEWithLogitsLoss完整文档段及LICENSE全文。
  参考未加权二元交叉熵、reduction与稳定计算的事实；未复制实现。
  实际LICENSE包含Facebook/Caffe2等多方版权及BSD条件，不概括为Brook MIT。

固定来源：
https://github.com/pytorch/tutorials/tree/5277794075fd393cf24f139ac978f96bc06b5aa3
https://github.com/pytorch/pytorch/tree/2a2d844941bf776d1a49a8ff8730e90f5242f836

PyTorch不是依赖，也未执行PyTorch、autograd、加速器或模型服务。
本例手工实现固定结构的偏导，和框架的浮点、梯度累加或一般动态图机制
并不等价。原教程的简化说明也不应理解为中间张量永远不能保留梯度。

运行需用户自备CPython3.11+，不打包解释器或标准库；完整现有官方3.11.18
许可与历史声明保留在licenses/CPython-LICENSE.txt。来源阅读不是上游背书。
