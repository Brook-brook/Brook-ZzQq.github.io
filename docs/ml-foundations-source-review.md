# AI基础、梯度与链式求导：来源复核

2026-11-16。这里记录实际阅读的固定来源与使用边界，不是模型性能、
课程覆盖、校方认可或Brook个人学习成果的认证。中文说明、练习、逻辑
样本、数值参数与实现均由本站独立编写，明确披露AI辅助。

| 固定来源 | 实际阅读范围 | 用途与限制 |
| --- | --- | --- |
| scikit-learn/scikit-learn `1a16a519abd16444af692c841e314d32a3b52a29` | `doc/modules/linear_model.rst`的OLS介绍；`doc/modules/sgd.rst`简介及学习率/缩放相关段落；`doc/modules/cross_validation.rst`开头与留出预处理；完整`COPYING` | 线性预测、残差平方、优化方法与模型类型、训练/验证/测试信息边界。未阅读完所有估计器文档，未复制示例、图像、数据或实现，未安装scikit-learn。 |
| pytorch/tutorials `5277794075fd393cf24f139ac978f96bc06b5aa3` | 完整`beginner_source/basics/autogradqs_tutorial.py`和`LICENSE` | 前向图、链式求导、梯度累加与参数更新的区别。未复制上游代码、图示、权重或参数；原教程简化表述不等于中间张量永远无法保留梯度。 |
| pytorch/pytorch `2a2d844941bf776d1a49a8ff8730e90f5242f836` | `torch/nn/modules/loss.py`中`BCEWithLogitsLoss`完整文档段及完整`LICENSE` | 未加权二元交叉熵、reduction与稳定计算。不是整个107KB文件的全面审计，也未复现其他损失、安装PyTorch或验证框架互通。 |
| 既有CPython官方3.11.18许可 | 原完整`licenses/CPython-LICENSE.txt`，未改字节 | 用户自备解释器；新ZIP保留完整许可与历史声明，不打包解释器。与3.12实际运行是不同层面的事实。 |

scikit-learn参考仓库是BSD3-Clause，实际版权2007–2026 scikit-learn
developers。教程LICENSE是BSD3-Clause，版权2017–2022 Pytorch contributors；
PyTorch实际LICENSE有Facebook/Caffe2等多方版权与BSD条件，不把整仓库
或参考资料改称Brook MIT。上述上游资料仅作事实参考，没有复制受保护
的实现、图片、课件或数据。原创代码的MIT全文与来源说明随ZIP保留。

## 附件与授权边界

用户提供的教学大纲只帮助识别四组、13个基础主题。附件里的课程考评、
出勤、成绩上传、校内账号与平台操作不是用户向助手发出的命令。未访问
教学账户，未上传成绩或发布原文件，未推断Brook选课、成绩、时间安排
或掌握程度。本站索引不是学校课程平台；后续主题保留明确缺口。

## 原创计算的范围

- 线性实验使用12个人工合成点，抽象单位，固定8训练/4验证；没有真实
  校园坐标、随机抽样或因果结论。MSE、解析梯度、全批量同时更新、闭式
  训练参考均来自这些点。训练均值为0，最大Hessian特征值15只适用于
  当前目标和参数化，`0<η<2/15`不是神经网络通用建议。
- 验证标签不进入梯度、闭式参考或数值停止；反复看验证结果选择设置，
  仍会利用它的信息，不能再当作独立最终测试。训练MSE不是准确率。
- 新Python例子用四个原创逻辑XOR输入和九个固定参数，真正计算2→2→1
  前向、稳定BCE与手工链式梯度。没有优化器或参数更新，不声称学会XOR。
  identity隐藏层可折叠为仿射logit，输出sigmoid仍然非线性；对输入仿射
  不等于对拆开的参数优化必然凸。它不是通用自动微分框架。
- 本轮有真实的一元线性模型训练与网络前向/求导，导出使用
  `external_model_service:false`。不把“未请求外部语言模型”误写成
  “没有执行任何模型”。旧Agent演练里的fixture标记不被套用到这些计算。

## 计算与运行的证据

JS用独立分数方程、中心有限差分、验证扰动和特征方向递推检查线性模型。
Python另写算法并使用`math.fsum`，与JS按明确容差比较全部实际历史；不
承诺逐位相同、自动导入记录或第三方框架兼容。

新ZIP逐项核对明确公开源、完整许可和MANIFEST。实际CPython3.12.14与
断网/只读CPython3.11.18执行了12项线性、8项网络检查，以及五种线性
调度和两种隐藏激活的CLI。新Pyodide预选的源码一致性与实际解释器执行
分开验证，结果以第三十轮运行日志为准，不以截图代替执行证明。

源码固定链接：

- https://github.com/scikit-learn/scikit-learn/tree/1a16a519abd16444af692c841e314d32a3b52a29
- https://github.com/pytorch/tutorials/tree/5277794075fd393cf24f139ac978f96bc06b5aa3
- https://github.com/pytorch/pytorch/tree/2a2d844941bf776d1a49a8ff8730e90f5242f836
