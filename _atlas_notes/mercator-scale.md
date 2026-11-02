---
layout: atlas
title: "墨卡托为什么放大高纬地区？"
summary: "从局部尺度因子出发，区分地图距离、地面距离与面积失真。"
description: "从局部尺度因子出发，区分地图距离、地面距离与面积失真。"
category: "GIS"
tags: [projection, coordinates, GeoAI]
date: 2026-11-02
lab_url: /playground/#geo
section: Knowledge
toc:
  - id: assumptions
    label: 先明确模型
  - id: scale
    label: 长度与面积
  - id: limits
    label: 把边界带进计算
---

## 先明确模型 {#assumptions}

本实验采用**球面墨卡托投影**。纬度 φ 在 −80° 到 80° 之间，演示同一点附近的局部尺度，不计算任意两点的测地距离。

在球面半径为 R、中央经线为 λ₀ 时：

```text
x = R (λ − λ₀)
y = R ln[tan(π/4 + φ/2)]
```

角度需以弧度代入。经纬度属于角度坐标；投影平面上的 x、y 使用与 R 一致的长度单位。

## 长度与面积 {#scale}

球面墨卡托在一点的局部长度尺度为：

```text
k = 1 / cos(φ)
局部面积尺度 = k²
```

赤道处 k = 1；纬度 60° 处 k = 2，局部面积尺度为 4。它在球面模型下局部保角，但不等面积。图上形状看似自然，并不说明面积正确。

这是局部微分性质。不能用两个端点某一纬度的单个 k，准确修正一条跨越大范围的路线。

## 把边界带进计算 {#limits}

在开展缓冲区、长度或面积分析前，核实 CRS、单位、区域范围及精度需求。Web Mercator（EPSG:3857）使用球面投影公式处理地理坐标，但真实地球和椭球测地量需要额外考虑；本实验不能直接替代专业测量。

GIS Agent 也需要遵守这些前提。让模型组织请求，让经过验证的工具计算，让说明忠实于输入与模型假设。

参考：[PROJ Mercator 文档](https://proj.org/en/stable/operations/projections/merc.html)。
