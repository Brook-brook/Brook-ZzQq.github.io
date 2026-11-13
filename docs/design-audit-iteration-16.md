# 第十六轮限定设计复审：学习工具先服务于解释

2026-11-13。此审查在新增功能完成后执行，范围是AI评测、空间留出与自解释
练习三个工作界面，不是重做全站或重新选择主题。遵守根design.md锁定的奶紫/
深紫、单层克制玻璃、本地字体和小型Mote；不套用营销页版式或装饰性数据。

## 方法与真实执行

实际读取Hallmark2.0.0提交
[04977e15](https://github.com/Nutlope/hallmark/tree/04977e15f3dfd6ee4b74c887dac3eb52665d6c92)：
README、[SKILL.md](https://github.com/Nutlope/hallmark/blob/04977e15f3dfd6ee4b74c887dac3eb52665d6c92/skills/hallmark/SKILL.md)、
Redesign、Flow的App/Harness与Sweep部分、Gates及LICENSE。使用原仓库脚本，
没有声称调用slash命令或把公开主题当作Brook品牌。

命令为 `sloplint.mjs` 加 `--genre playful --scope app --render`、三个本地
真实URL，先 `--before`，修正后 `--kept`。源范围是evaluation、spatial-validation、
practice、learning四份样式及共享token；运行于ignored work/目录中的固定
上游源码，puppeteer-core25.17.0配合本机Chromium。每轮生成15张真实截图：
1280×800、1440×900、1920×1080首屏，以及1440与375全页；另有项目自身的
390/768/1440双主题实拍。不是用静态代码代替浏览器检查。

三个屏幕都是app工作区：不采用营销页的照片/80词/整屏hero门槛。任务分别
是核对每条分类错误、追踪邻居证据、写出自己的解释。主要视觉是实际矩阵、
合成点和可用的工作纸；不存在假产品截图、虚构用户数或自动学习成绩。

## 发现、取舍与修正

1. 初版练习的全部筛选和展开的记录摘要占据手机前段，当前问题出现过晚。
   改为直接选题/下一题，次级筛选原生收起，存储警告和备份入口仍可见；
   参考来源说明放到练习之后，先写解释，再手动自检。当前问题标题已纳入
   三屏宽双主题的首视口断言。
2. 工具实际找到原生题目目录展开后被旁边链接挤窄的问题。提高练习导航的
   作用域优先级，展开目录占满可用宽度；保留完整题名与真实公共锚点，
   不通过截断标题、删除问题或改测试逃避检查。
3. 初审指出新样式原始间距没有使用已有token。已统一复用全局节奏；20/32/48
   由既有token组合，6/10的小间距归入8/12。颜色、字体继续全部复用主题。
   也移除与面包屑重复的两个实验大写装饰标签，补标题平衡与断词约束。
4. 继续自检的长目的地标题挤在紧凑摘要中。可见文案简化为“继续自检”，
   完整目标仍在aria-label和原href；公共目录的完整标题保留。
5. Hallmark的矩阵按钮尺寸提示作为Reflex39b明确保留：这些是带“结果+数量”
   的数据选择单元格，最小92px并非普通CTA。缩小会损害可读性和点击面积。
   F4来自一次合并扫描两张独立页面的主按钮配方；F7是实际表单控件的统一
   边界而非重复内容卡；F16所需selection/caret/scrollbar已在共享obsidian.css。
   三项Finish说明写入检查注释，未把机器提示伪装成产品缺陷。

原始初审：44 FAIL、10 REFLEX、4 WARN。第一次确认已无FAIL，但例外注释的
字段格式被拒绝；保留这份日志，修正格式后再确认，没有伪报一次通过。
最终实际输出：**0 FAIL、0未处理REFLEX、0 WARN、1 WAIVED、3 ANSWERED**。
`--kept` 保留52/52链接、43/43字段、38/38标题和33/33图形条目；后者是工具的
DOM inventory，不代表33个独立产品图表，也不是使用人数或学习成就。

[初审](iteration-16/hallmark-before.txt)、[被拒绝的例外格式](iteration-16/hallmark-after.txt)、
[最终确认](iteration-16/hallmark-final.txt)。不宣称整站所有历史CSS均零警告。

## 独立复核

依据Hallmark Gates§6，由没有继承开发对话的审查者读取原review-finish提示，
查看三页1440/375修改前后全页与练习双主题截图，并用新headless上下文检查
375px双主题：可滚动表格、展开披露、16px选择框、无页面溢出与JS异常。
结论为 **ship**，0项实质发现；与锁定设计的最大差距为none。审查没有修改
文件、接触用户个人浏览器、合并PR或发布网站。原文见
[复核记录](iteration-16/finish-review.txt)。

## 视觉证据与实际边界

- [初版手机](iteration-16/screenshots/first-390-dark.png)
- [修正后手机](iteration-16/screenshots/final-390-dark.png)
- [桌面浅色](iteration-16/screenshots/final-1440-light.png)
- [展开参考的工作纸](iteration-16/screenshots/reference-390-light.png)

初版全页截图还带入了离屏的“跳至正文”构图伪影；实际DOM检测显示该链接
未聚焦且位于视口外。后续拍摄先归顶；键盘Tab显示、Enter跳正文另行实测，
没有把拍摄问题说成已修复的焦点缺陷。

浏览器实测为Chromium。WebKit安装下载实际收到403 Domain forbidden，未
绕过网络策略；Safari/Firefox、真实手机键盘/读屏仍未验证。DOM200%文字
缩放不冒称系统缩放或真实设备测试，axe也不是完整无障碍认证。
