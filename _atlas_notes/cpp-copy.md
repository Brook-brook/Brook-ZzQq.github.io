---
layout: atlas
title: "复制了对象，为什么数据仍然共享？"
summary: "追踪裸指针、独立资源与析构，理解浅拷贝的真实风险。"
description: "追踪裸指针、独立资源与析构，理解浅拷贝的真实风险。"
category: "C++"
tags: [OOP, memory, RAII]
date: 2026-11-02
lab_url: /playground/#copy
section: Knowledge
toc:
  - id: object
    label: 对象和资源
  - id: copy
    label: 复制与修改
  - id: ownership
    label: 析构与所有权
---

## 对象和资源 {#object}

对象的存储与对象管理的资源是两个层面。一个 `Box` 对象可以包含一个指针成员，而指针所指向的整数位于另一块动态分配的内存中。

构造函数建立对象的有效状态，析构函数负责结束其生命周期时的清理。**编译器不会因为一个成员是裸指针，就自动知道它是否拥有资源。**

## 复制与修改 {#copy}

默认复制构造对成员逐个复制。对于 `int*`，复制的是地址。因此两个对象可以指向同一整数；修改这个整数，双方通过指针观察到的值都变化。

```cpp
// 仅展示复制构造的差异
Box(const Box&) = default;              // 指针值被复制
Box(const Box& b) : p(new int(*b.p)) {}  // 另分配资源并复制整数
```

这两行是替代方案，不能同时写进同一个类。深拷贝构造依赖原对象的指针有效，本实验中构造后始终满足这一前提。

## 析构与所有权 {#ownership}

若两个浅拷贝对象都在析构时 `delete p`，第一个析构会让另一个对象的指针悬空。后续解引用或重复释放可能触发未定义行为，不能用“必然崩溃”描述它。

实验用 `std::optional<Box>` 显式先销毁 A，再检查 B 的关系。浅拷贝分支停止在风险点，展示的危险示例不应运行。

如果手写拥有资源的类型，复制构造、复制赋值与析构需要一致（Rule of Three；涉及移动语义时还需考虑 Rule of Five）。深拷贝示例没有实现复制赋值，不是完整的生产级值类型。

优先选择 Rule of Zero：让 `std::vector`、`std::string` 等 RAII 类型管理资源。`std::unique_ptr` 不可复制；`std::shared_ptr` 的复制共享所有权，资源在最后一个所有者释放后销毁，它不是深拷贝。

继承与多态还需要额外考虑基类析构等问题，当前实验不覆盖这些语义。

参考：[cppreference：复制构造](https://en.cppreference.com/w/cpp/language/copy_constructor)。
