# 词项向量与索引边界：资料复核

2026-11-16实际通过公开GitHub读取以下固定来源；两篇教程、注册表与代码
由AI辅助独立编写。资料核对不是Brook人工审批、通用模型能力认证或新闻更新。

上游scikit-learn主线固定于
`1a16a519abd16444af692c841e314d32a3b52a29`。实际阅读范围：

| 来源 | 范围与用于核对的内容 |
| --- | --- |
| [feature_extraction.rst](https://github.com/scikit-learn/scikit-learn/blob/1a16a519abd16444af692c841e314d32a3b52a29/doc/modules/feature_extraction.rst#L433) | TF-IDF节约430–625行：平滑IDF、TF、L2、拟合和变换 |
| [text.py](https://github.com/scikit-learn/scikit-learn/blob/1a16a519abd16444af692c841e314d32a3b52a29/sklearn/feature_extraction/text.py#L1499) | 约1480–1740行：TfidfTransformer文档、fit/transform；没有阅读整仓库的声明 |
| [pairwise.py](https://github.com/scikit-learn/scikit-learn/blob/1a16a519abd16444af692c841e314d32a3b52a29/sklearn/metrics/pairwise.py#L1674) | 约1667–1755行：余弦定义、零行示例与归一化后内积 |
| [COPYING](https://github.com/scikit-learn/scikit-learn/blob/1a16a519abd16444af692c841e314d32a3b52a29/COPYING) | 完整BSD3-Clause，2007–2026 developers版权与三条条件/免责声明 |

没有复制上游实现、示例、图表、正文段落、数据或模型权重。新项目只保留
原创MIT材料和完整既有CPython许可，不把上述上游重新标为MIT。

## 本站明确选择的规则

14个固定词项，对标题、节名、正文以换行连接后的NFKC/小写文本计数。
每列数不重叠字面子串，不同列可相互重叠；查询使用相同规则。不是
CountVectorizer默认分析器、完整中文分词、神经Embedding或语言理解。

以全部8片段为拟合行，N=8而非文档数4。IDF采用
`ln((N+1)/(df+1))+1`；TF为原始计数，随后分别作L2归一化。查询、相关性
标注和候选版本筛选不重拟合。合法的新索引必须明确保留自己的统计与
输入快照；不能把索引变化后的分数当同一尺度上的提升。

零范数余弦未定义，本站使用null/“—”；非零正交向量的0是另一个情况。
scikit-learn按其软件约定为零向量返回0，对照时单列，不伪称完全一致。
同一查询的原字面基线仍按不同空格查询词命中数排序，两者单位不同。
高余弦不证明版本适用、事实正确或生成任务成功。

## 已实际执行的独立数值比较

从实际ZIP解压原创Python核心，以主机既有scikit-learn1.8.0比较同一显式
计数矩阵的TfidfTransformer/normalize与cosine_similarity。28次设置中，
128个有定义余弦的最大绝对误差为`2.220446049250313e-16`；另有96个
零范数约定情况独立核对。没有新安装或将此库加入网站/下载依赖。

另有独立原创三行两列手算矩阵，检查平滑IDF、原始计数和加权余弦。
这是受限组件算术、记录复算与边界检查，不是任意文本分析器等价、
真实语义检索性能、独立任务评测或学习成绩。完整最终构建、浏览器与
运行证据在本轮交付材料分别记录。
