# 第二十七轮：把异步基础，接回真实运行

基于已推送、未合并26/e3d56d5，开发分支`feat/atlas-iteration-27`。
在完整本机宿主项目之后补清Python等待/取消，继续复用现有实验、原生
阅读和手动学习生态。没有添加第二个编辑器、框架或模型服务。

## 能实际学习和运行的内容

新原创AI辅助笔记`/knowledge/python-async-boundaries/`区分协程函数/对象、
Task调度、Event等待和TaskGroup归属，再把取消带回Agent桥接代码。
六条精确ZIP内容约4.7KiB，只需本机Python3.11+标准库，无pip或Key。

原Python Playground新增第四个真实示例，和本机`async_wait.py`复用同一
源码。默认对照取消与释放：先观察创建协程后的空记录，再实际等待、
清理、等任务结束；最终状态/事件由Python运行得到，没有预写输出替代。
`#async-wait`只预选源码，不自动下载解释器或执行。旧三个示例完整保留。

示例不声称async让CPU自动并行，也不把cancel请求、最终取消与终止Worker
混为一谈。未开始协程不保证进入finally，其他代码也可处理取消；页面
停止/超时是直接终止Worker，不保证清理或撤回外部动作。

新基础路线在原36之后追加两道永久题目，总12路线38题；旧v1 key/schema
与原始记录保持。共23篇公开笔记、35条编排联系、63条公开搜索元数据。
AI搭建入口补一个可选基础链接，教程→实际实验→自解释→本机资料都有
真实目的地，不建立强制解锁或自动掌握。

## 根据真实页面做的改进

Python页面用短标题和面包屑，环境说明有清楚的原生展开入口，手机更早
看到加载/运行。结果/错误出来后可显式跳到真实输出并接收键盘焦点，
执行时源和选择暂锁；改代码时说明当前输出仍属上次运行。无JS时控件
禁用、编辑器只读，教程及本机ZIP仍可使用。

320px链接换行在Hallmark中被发现，现缩短问题/来源标签并保留全文。
三条最终编译URL/15截图为0 FAIL/REFLEX/WARN；一次独立finish review
为ship零发现。首次误传源HTML造成file URL拦截和缺全局CSS诊断，记录
已保留；后来只用已编译URL，不把源目录当预览。

手机与320px正文实际16→32、按钮13.6→27.2/下载16→32仍完整换行、
无整页溢出。另检查390宽度。此为DOM文字重排，不是完整浏览器缩放。

## 实际检查

| 检查 | 结果 |
| --- | --- |
| `npm run build`、`npm test` | 通过，含项目现有JS/SCSS lint |
| `npm run test:atlas` | 135项通过；最初新包装器把路径当unittest名字，修正sys.argv后确实执行六项检查 |
| 容器`bash tools/test.sh` | 43真实案例/238断言，68 HTML/466初始内链通过 |
| 最终根/子路径 | 最终构建、产物、浏览器与HTMLProofer通过；两路径均68 HTML/467内链 |
| `python3 tools/check-async-package.py` | 实际ZIP、六项标准库测试与两条CLI JSON结果通过，无SDK |
| Python3.11.18 | 同一ZIP在非root/禁外网/只读容器通过六项，公开SHA核对一致 |
| 真实Pyodide | 根/子路径四例含真实等待/取消，空均值/异常/输出上限/超时/停止/重载及输出焦点通过 |
| 新基础页浏览器 | 390/768/1440双主题、真实下载SHA、原生预选/恢复、无自动外请求/私人存储访问、axe/键盘/无JS/320通过 |
| 27整站浏览器套件 | 单次完整全部通过；UI修正后新基础页/真实解释器在两路径另完整通过 |
| Hallmark/独立复核 | 最终三URL/15截图全部干净，ship零发现 |

旧36 raw/导出在paths/practice保持逐项相同，明确新操作才新增第37条。
新路线放在原路线之后，保留此前继续位置。没有访问用户的浏览器手记。

额外`stylelint assets/css/atlas.css`并未通过：基线356，本轮355，新增块
零项，主要是原有空行等格式规则及一处弃用风格。保留对照，避免把现有
npm lint通过说成全CSS无债。没有为此大规模格式化主样式表。
Safari/Firefox、实体手机、OS输入法与完整浏览器缩放未验证。没有真实
模型、远端认证、Pages/生产工作流变更、自动合并或部署。

## 文件、来源和预览

主要文件：新异步笔记、`_includes/python-async-starter/`、ZIP/manifest与
显式打包输入、`playground/python.html`、`assets/js/atlas/python.js`和局部
Python反馈样式；路线/问题/联系、AI入口、首页和相应真实测试同步更新。

官方来源固定CPython3.11.18的协程/TaskGroup/取消/状态/Event相关部分。
完整实际PSF2/历史/文档代码0BSD许可保留，原创程序MIT，未复制示例或
转存Python库；既有Pyodide许可不变。[compliance](iteration-27-compliance.md)。

[审计](design-audit-iteration-27.md)、[构建](iteration-27/build-results.txt)、
[浏览器](iteration-27/browser-results.txt)、[标准库/包](iteration-27/archive-results.txt)、
[Hallmark](iteration-27/hallmark-results.txt)、[独立复核](iteration-27/finish-review.txt)。
前后/实际结果截图在iteration-27/screenshots/。

从当前分支成功CI下载`atlas-review-preview`，按[PREVIEW.md](PREVIEW.md)在
包含项目文件夹那层运行`python3 -m http.server 8000`。打开：

```text
http://127.0.0.1:8000/Brook-ZzQq.github.io/study/ai/#agent-workshop
http://127.0.0.1:8000/Brook-ZzQq.github.io/playground/python/#async-wait
```

线上没有自动切换分支。下一步可用少量自己的真实任务检验工具/证据/
任务边界；不把离线脚本、计数或协议成功当作模型能力成绩。
