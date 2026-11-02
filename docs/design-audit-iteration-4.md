# Brook’s Atlas 第四轮设计审计

审计日期：2026-11-02。基线：`feat/atlas-iteration-3`，`ffba216`。
本文件在第四轮产品代码修改前建立；实施结果另记于验收报告。

## Hallmark 研究与真实执行

读取 Nutlope/hallmark 公开版本 `4f6a46c6dc325d40ab268c93e25c7b96676ebccd`，Skill v2.0.0。
研究 README、完整 SKILL、redesign、flow、direction、craft、gates、responsive、microinteractions、brand-truth、Refract 主题与 sloplint / render 源码。
Refract 是清透玻璃，而本项目要求磨砂；因此不复制该主题，沿用用户给出的 Obsidian Glass 品牌规范。

实际安装：`npx --yes skills add nutlope/hallmark --agent codex --skill hallmark --yes`。
安装位于项目 `.agents/skills/hallmark`，锁文件随项目提交。实际运行 `theme.mjs scaffold --brand --redesign full --scope app` 生成参考 token / base 骨架。
实际审计：`sloplint.mjs assets/css/campus.css assets/css/atlas-tokens.css --genre atmospheric --scope app --render --before --url http://127.0.0.1:4173/Brook-ZzQq.github.io/explore/`。
渲染使用真实本地 Chromium 与 puppeteer-core；八档宽度检查，另输出桌面及手机截图。基线结果：19 FAIL、70 REFLEX、3 WARN，原始输出见 `iteration-4/hallmark-before.txt`。
首次把 Liquid 源 HTML 也交给渲染器时 file:// 被环境阻止，随后改为真实 Jekyll HTTP 页面，重新记录完整有效基线；没有把未渲染结果视为通过。

线上 Pages 域名受当前环境网络策略限制，无法现场验证生产页面。此报告依据实际第三轮源码与本地 Jekyll 构建，不声称线上验收。

## 现状与问题

- Jekyll 构建、HTMLProofer 基线通过：36 个文件、144 个内部链接。
- 1440 × 900 首屏完全被介绍、吉祥物轨道和大标题占据，真实地点图仍在折叠线后。用户进入探索工具却要先通过宣传页。
- `explore/index.html` 的大写眉题、单独斜体着色词、装饰状态点、终端命令及链接箭头重复出现，形成 Hallmark 所指的默认生成式视觉语汇。
- `campus.css` 依靠大量局部尺寸与表面特效；标题、卡片和地图的层级没有共同的材质规范。三个实验室又重复同一张卡片。
- 地图被厚重外框、顶部品牌条和外部详情分散，地图与地点列表的关系不够直接。详情在地图下方，选择后可能使页面滚动。
- 原有动效有边界、触屏和减少动画处理，但全页出现动画、轨道和卡片同时强调，用户操作反馈与装饰难以区分。
- 手机会先经过更长的介绍才到达地图；地图、筛选、列表、详情需要更明确的阅读顺序。Hallmark 发现状态条文字遮盖、狭窄宽度链接换行、小字号等需实测修正。
- 原有亮色主题、旧博客、学习模块必须继续可用，不因 Explore 的视觉升级删除。

## 要保留的产品事实与交互

六处有来源的 WGS84 代表点；不新增猜测地点、道路、建筑轮廓或湖泊形状。
数据图不是校园道路底图，必须持续明确；食堂、宿舍暂无已核实坐标，学习空间复用图书馆，不代表实时开放。
保留搜索、七个分类、收藏及只看收藏、来源链接、列表选点、标记与引线、网格/地点/标签图层、平移缩放与复位、键盘、加载错误重试、无脚本可读列表。
保留 session 视图与 localStorage 收藏、所有既有路由、学习入口、主题切换、导航、原有脚本查询钩子与测试。收藏不会发送到服务器，不申请定位。

## Hallmark 原则在本项目的应用

地图是工具页面的主体与独特视觉，不再使用营销 Hero；强调真实空间数据而非用插画替代产品。
用排版、对齐与留白建立层级；删除空洞口号、眉题、装饰状态点；实测所有状态而非只看静态代码。
颜色与字体经过全局 token，焦点立即可见，动画仅回应动作；保留无脚本、键盘、减弱动态和移动端。
用户明确要求的紫黑、磨砂玻璃、克制磁吸与弹性选点优先于 Skill 的通用审美限制，逐项记录具体适用范围；不将其扩散到全部卡片。

## 方向选择与实施计划

考虑三种结构：全屏地图浮层、左右分栏地图工作台、校园编辑式导览。选择地图舞台加克制浮层：地图成为第一屏可操作内容，点列表与详情服务于选点，信息密度不仿管理后台。

1. P0：Obsidian 全局色彩、字体、间距、三层玻璃 token。保留同源浅色系统与旧博客兼容。磨砂仅限离散浮层，纯色 fallback，手机降低强度。
2. P1：Explore 地图优先。短标题与地图同屏；搜索/地点列表可收起；地图方位、图层、坐标读数有固定位置；选点详情在地图工作区内。
3. P2：玻璃导航与连续选中指示、克制磁吸、操作驱动的详情入场与标记选中反馈。无持续背景动画，不创建框架依赖。
4. P3：移动端先显示地图，列表为可控区域；详情不遮住控件。保留所有来源和学习入口，改为简洁索引而非三张重复卡片。
5. P4：Hallmark `--render --kept`、独立 finish review、真实浏览器截图后修正；运行原有构建和回归测试，提供前后对比。

计划修改：`explore/index.html`、`_layouts/atlas.html`、`assets/css/atlas-tokens.css`、新增独立 Explore 样式、`assets/js/atlas/campus.js` / motion shell 必要增强，文档与仅用于审查的 CI artifact。保留旧样式文件，不删除页面。不会修改 Pages 发布来源、部署工作流、站点 URL 或 baseurl。
