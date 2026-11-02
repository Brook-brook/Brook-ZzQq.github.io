---
layout: atlas
title: "用 Python 把一个问题拆成输入与输出"
summary: "从变量、条件与循环，到函数、列表和字典的可执行小例子。"
description: "从变量、条件与循环，到函数、列表和字典的可执行小例子。"
category: "Python"
tags: [variables, loops, functions]
date: 2026-11-02
lab_url: /playground/python/
section: Knowledge
toc:
  - id: values
    label: 变量与类型
  - id: control
    label: 条件与重复
  - id: data
    label: 组织数据与函数
---

## 变量与类型 {#values}

Python 的变量名绑定到对象。对象具有类型，不必为变量预先声明固定类型。把整数、浮点数、字符串与布尔值区分开，有助于判断操作是否有意义。

```python
label = "Demo"       # str
count = 3            # int
latitude = 60.0      # float
is_north = latitude > 0  # bool
print(type(latitude).__name__)
```

这里使用演示数据，不表示任何人的精确位置。

## 条件与重复 {#control}

`if` 选择执行路径，`for` 遍历可迭代对象。缩进是语法的一部分。尝试修改条件，观察哪些输出出现。

```python
heights = [12, 18, 24]
for height in heights:
    if height >= 18:
        print("High:", height)
```

## 组织数据与函数 {#data}

列表按顺序组织值；字典用键组织关系；函数把可复用的行为与输入、输出连接起来。

```python
def mean(values):
    if not values:
        raise ValueError("Need at least one value")
    return sum(values) / len(values)

point = {"label": "Demo", "heights": [12, 18, 24]}
print(point["label"], mean(point["heights"]))
```

Playground 通过 Pyodide 执行真实 Python，在 Worker 内运行，每次使用新的全局命名空间。它没有完整本地 Python 环境的全部能力：文件系统是虚拟的，包与系统接口存在限制，运行超过 5 秒会终止解释器。

发生语法或运行错误时，先看输出里的异常类型与代码位置。错误是可以验证的反馈，不需要用猜测替代调试。

参考：[Python 官方教程](https://docs.python.org/3/tutorial/)。
