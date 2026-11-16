---
layout: atlas
title: 从词项计数，走到余弦
title_keep: 余弦
date: 2026-11-16
category: Machine Learning
kind: tutorial
ai_assisted: true
tags: [TF-IDF, tfidf, 词项, 余弦, cosine, L2, 向量检索, Python, RAG]
summary: 用明确的特征列、平滑IDF和L2归一化，逐项复算相似度；区分词表遗漏、零向量与真正定义的零分。
lab_url: /playground/vector-retrieval/
download:
  path: /assets/examples/retrieval-vectors.zip
  filename: brook-retrieval-vectors.zip
  label: 下载向量练习
  detail: Python3.11+标准库，10项检查与5个真实计算设置，无需pip或模型Key。
toc:
  - {id: features, label: 每一列是什么}
  - {id: weighting, label: 计数与IDF}
  - {id: cosine, label: 归一化与余弦}
  - {id: zero, label: 零向量遗漏了什么}
  - {id: run, label: 自己运行}
  - {id: sources, label: 来源与范围}
---

本篇由AI辅助、独立编写，使用本站原创虚构手册。把文本变成数字向量，
首先要决定数字代表什么。本例用固定词项次数建统计索引，不调用神经
语义模型，也不生成回答。

## 先决定每一列是什么 {#features}

打开[向量实验]({{ '/playground/vector-retrieval/' | relative_url }})，先看默认
“保留 空间”。八行来自原检索实验的八个片段，14列是显式固定词项。
每行把文档标题、节名和正文以换行连接，NFKC规范化并转小写，再逐项
作不重叠字面子串计数；查询使用相同规则。

例如“aaaa”中“aa”数2次，“a”数4次。不同列可覆盖同一段字符；这是
特征提取规则，不是自动中文分词。标题也参与：“记录保留手册”会贡献
“记录”和“保留”，不能只数正文后再把结果当成同一矩阵。

另取一个**独立原创三行小矩阵**方便手算，不是网页八行的截取：

| 行 | a计数 | b计数 |
| --- | ---: | ---: |
| 第一行 | 2 | 1 |
| 第二行 | 0 | 1 |
| 第三行 | 0 | 0 |

查询为`[1,1]`。最后一行没有落入这两个特征，但仍是拟合语料中的一行。

## 计数与IDF，分别改变什么 {#weighting}

这里TF是原始计数，没有取对数。df是含该词项的行数，不是出现总数；
一行重复十次也只贡献一个df。网页以片段为行，所以N=8，不是原文件数4；
小矩阵N=3，两个词项df分别为1和2。

采用明确的平滑公式，自然对数ln：

```text
idf(t) = ln((N+1)/(df(t)+1)) + 1
weight(t,row) = count(t,row) × idf(t)
```

小矩阵中a的IDF约1.693147，b约1.287682。第一行加权后为
`[2×1.693147, 1×1.287682]`。较少行含有的词项权重更大；这是所选语料
上的统计，不证明它与真实问题更相关。

切到原始计数模式时，实际乘数全部为1。IDF列仍显示拟合统计供比较，
不能把未使用的IDF当成已经参与计算。

## 先归一化，再累加每一项 {#cosine}

对非零向量，L2范数为平方和开根，再把每项除以该范数：

```text
norm(v) = sqrt(sum(v_i²))
unit(v)_i = v_i / norm(v)
cosine(q,d) = sum(unit(q)_i × unit(d)_i)
```

小矩阵原始计数模式下，第一行与查询的余弦为`3/sqrt(10)`，约0.948683；
按上述IDF加权后约0.959146。变化来自表示与归一化，不是语言模型理解文本。

网页每条横条是一维归一化权重的乘积，14项相加得到余弦。完整计数、
范数和向量在表格及JSON里；显示小数有舍入，复算应使用完整值和容差。
一般余弦范围[-1,1]；本例词频/IDF非负，有定义的分数在[0,1]附近，没有
概率单位。把查询整体重复一遍不改方向，只重复“保留”则可能改变比例。

本页固定数据中，TF-IDF、全部版本、k=2时，“保留 保留 空间”会把v1旧片段
排到第一，约0.795536。原字面实验的默认问题明确询问v2；旧片段仍不能
满足这个版本条件。改变词项比例并没有
核对版本适用性。

## “7天”在哪里消失了 {#zero}

点“试试7天”，再明确计算。原文含这个字符串，原字面规则能找出候选；
固定14词项却没有“7天”，查询向量全零。

零向量没有方向，公式分母为0。本实验用null和“—”表示未定义，区别于
两个非零正交向量的分数0。部分软件将零向量相似度约定为0，这是另一种
软件约定，不能反过来证明公式分母不为0。

结果说明表示漏掉了所需信息，不是原文不存在或答案已经核查。词表、
分词器、模型及池化等表示选择都要与任务一起验收，不能仅凭“向量”
这个名字判断语义能力。

## 在自己的Python复算 {#run}

解压项目，进入README所在目录：

```sh
python3 demo.py
python3 demo.py --case count
python3 demo.py --case gap
python3 run_checks.py
```

也可[预选词项向量的Python实验]({{ '/playground/python/#lexical-vectors' | relative_url }})，
明确加载解释器后运行。网页输出两次实际计算的摘要，包含查询向量、
拟合统计与排序；完整片段矩阵仍在专用向量实验和CLI中。预选不会自动运行。

只需Python3.11+标准库。CLI保留公开语料、词表、已应用查询、完整矩阵和
分数。查询只出现在你明确运行得到的本机输出中。Python与网页求和顺序
可不同，不承诺浮点逐位一致。

接着读[索引边界]({{ '/knowledge/retrieval-index-boundaries/' | relative_url }})，
再去[原检索实验]({{ '/playground/retrieval/' | relative_url }})选择带条件的
完整上下文。这里仅计算检索组件，没有执行生成回答。

## 来源与范围 {#sources}

2026-11-16实际读取scikit-learn固定提交
`1a16a519abd16444af692c841e314d32a3b52a29`的TF-IDF节、
TfidfTransformer docstring/fit/transform和cosine_similarity定义及实现：

- [TF-IDF公式与归一化](https://github.com/scikit-learn/scikit-learn/blob/1a16a519abd16444af692c841e314d32a3b52a29/doc/modules/feature_extraction.rst#L433)
- [计数矩阵到TF-IDF](https://github.com/scikit-learn/scikit-learn/blob/1a16a519abd16444af692c841e314d32a3b52a29/sklearn/feature_extraction/text.py#L1499)
- [余弦与零向量示例](https://github.com/scikit-learn/scikit-learn/blob/1a16a519abd16444af692c841e314d32a3b52a29/sklearn/metrics/pairwise.py#L1674)

代码与小矩阵为原创，没有复制上游示例、实现或权重。固定子串特征
不是CountVectorizer默认分析器，零向量约定也不同；不声称通用框架等价
或真实语义检索成绩。
