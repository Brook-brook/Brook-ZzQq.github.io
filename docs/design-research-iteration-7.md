# awesome-design-md 研究与本轮选择

日期：2026-11-04。研究版本：VoltAgent/awesome-design-md，main
`fcc70284932276d085f01ef9f83edde90b1258cb`（2026-10-28）。

这是公开网站设计分析的 Markdown 集合，不是 UI 框架、运行时依赖或品牌官方认证。
本轮阅读 README、CONTRIBUTING、LICENSE，以及 Mercury、Oura、Linear 的设计文件，
未运行其 preview HTML 或安装工具。MIT 正文保留在 licenses/VoltAgent-awesome-design-md-MIT.txt。

## 学到的方法

[README 的规范结构](https://github.com/VoltAgent/awesome-design-md/blob/fcc70284932276d085f01ef9f83edde90b1258cb/README.md)
把氛围、语义配色、字体、组件状态、布局、深度、禁忌、响应式、Agent 指引写成统一约束。
价值在于明确颜色和材质的用途，而不是把喜欢的网站整体复制过来。

- [Mercury](https://github.com/VoltAgent/awesome-design-md/blob/fcc70284932276d085f01ef9f83edde90b1258cb/design-md/mercury/DESIGN.md)：
  学习墨紫夜色与浅薰衣草表面的层次，以及半透明次级胶囊按钮；不复制银行布局、蓝色品牌和专有字体。
- [Oura](https://github.com/VoltAgent/awesome-design-md/blob/fcc70284932276d085f01ef9f83edde90b1258cb/design-md/oura/DESIGN.md)：
  学习平静留白、柔和圆角、轻量阴影、移动端触达；不用其奶油绿配色、摄影或商业转化页面。
- [Linear](https://github.com/VoltAgent/awesome-design-md/blob/fcc70284932276d085f01ef9f83edde90b1258cb/design-md/linear.app/DESIGN.md)：
  学习表面和文字的等级、强调色只服务操作；不复制近黑管理面板或品牌资产。

## Brook 的独立实现

用户明确偏好淡紫至深紫、透明磨砂、软萌治愈，优先于之前更冷的近黑科技感。
保持个人数字花园内容与功能，改为深紫画布、奶紫浅色、淡紫主操作、可读的紫灰副文字。
玻璃仍只有导航、笔记本和已有浮层使用；不覆盖地图画布、不把全部内容包成卡片。
圆润来自按钮、控件和细腻边缘；亲切感来自已有原创 Mote，而非复制其它品牌吉祥物。

所有颜色仍集中在 atlas-tokens.css；新增 lavender.css 只表达组件材质和形状。
不引入字体、图片、动画库或运行服务。保留主题选择、键盘、减少动画、原生链接、
地图/实验交互和 GitHub Pages 子路径。增加减少透明效果时的纯色回退。
