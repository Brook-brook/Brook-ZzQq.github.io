# 第三十一轮实际验证材料

实现与截图检查于2026-11-16执行，工作区恢复后的收尾核对在11月17日。
见[交付](../ATLAS-ITERATION-31.md)及[PR31](https://github.com/Brook-brook/Brook-ZzQq.github.io/pull/31)。

| 材料 | 真实范围 |
| --- | --- |
| [build-results.txt](build-results.txt) | 实际npm、172模型、54发布用例/350断言、两个base路径构建/内链 |
| [browser-results.txt](browser-results.txt) | 新增浏览器项与两个路径Python；完整本机回归中断不冒充成功 |
| [runtime-results.txt](runtime-results.txt) | 10检查/5CLI、3.11无网络只读非root、HTTP下载后新venv及数值对照 |
| [hallmark-results.txt](hallmark-results.txt) | 新CSS/六个编译URL30帧，最终机械检查与49b/F4的具体解释 |
| [finish-review.txt](finish-review.txt) | 全新上下文前景终审原始ship/0修正 |
| [initial-findings.txt](initial-findings.txt) | 初版布局、条形/页脚字号、错误测试观察/扫描调用与实际修正 |
| [legacy-css-scope.txt](legacy-css-scope.txt) | atlas.css与30/e46786e字节相同，旧源债与新作用域分开 |
| [hallmark-shots/](hallmark-shots/) | 六页各5张实际1280/1440/1920首屏及1440/375全页 |
| [screenshots/](screenshots/) | 双主题、新状态、无JS、实际字号和旧版入口对照 |
| [screenshot-provenance.json](screenshot-provenance.json) | 旧版截图来自实际已归档30/e46786e；原始路径和哈希 |
| [files-changed.txt](files-changed.txt) | 相对30的实际改动路径 |

新向量页/两篇笔记没有30版对应页；中间状态不伪称旧版。字号放大是DOM
实际计算font-size翻倍，不是完整浏览器缩放。旧页脚暴露了body382px而
根元素305px的裁切；修正后body和根元素都305px，真实视口为320px。

截图只有公开原创教学数据、合成测试记录或空白工作台，没有私人手记。
新计算只读页面内存，明确导出包含已应用查询。统计向量不冒称神经语义
模型，组件正确不等于Agent任务成功或学习者掌握。

远端完整测试与下载产物以PR当前head为准，避免把中断前候选或核心
提交的成功当作最后提交。本站没有自动合并或部署。
