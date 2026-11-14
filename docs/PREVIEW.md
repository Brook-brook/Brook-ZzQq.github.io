# 下载与预览开发分支

开发PR没有自动合并或部署；线上页面不会因为下载了源码就变为新版。
预览请使用对应PR最新通过的GitHub Actions编译产物。

1. 在PR的Checks打开CI，进入成功的build(3.3)运行。
2. 在该运行页Artifacts下载 **atlas-review-preview**，然后解压。
3. 找到里面包含 `Brook-ZzQq.github.io` 文件夹的那层，终端进入这一层。

正确目录结构是：

```text
解压目录/
└── Brook-ZzQq.github.io/
    ├── index.html
    ├── assets/
    ├── study/practice/index.html
    └── playground/
```

在“解压目录”运行：

```sh
python3 -m http.server 8000
```

然后打开：

- http://127.0.0.1:8000/Brook-ZzQq.github.io/study/practice/
- http://127.0.0.1:8000/Brook-ZzQq.github.io/playground/evaluation/
- http://127.0.0.1:8000/Brook-ZzQq.github.io/playground/spatial-validation/
- http://127.0.0.1:8000/Brook-ZzQq.github.io/playground/tool-calling/
- http://127.0.0.1:8000/Brook-ZzQq.github.io/knowledge/
- http://127.0.0.1:8000/Brook-ZzQq.github.io/playground/public-goods/
- http://127.0.0.1:8000/Brook-ZzQq.github.io/study/ai/
- http://127.0.0.1:8000/Brook-ZzQq.github.io/playground/agent-runtime/
- http://127.0.0.1:8000/Brook-ZzQq.github.io/playground/retrieval/
- http://127.0.0.1:8000/Brook-ZzQq.github.io/knowledge/skills-mcp-boundaries/
- http://127.0.0.1:8000/Brook-ZzQq.github.io/knowledge/agent-loop-basics/#note-learning-questions
- http://127.0.0.1:8000/Brook-ZzQq.github.io/knowledge/agent-project-starter/
- http://127.0.0.1:8000/Brook-ZzQq.github.io/knowledge/agent-testing-contracts/
- http://127.0.0.1:8000/Brook-ZzQq.github.io/knowledge/agent-mcp-server/
- http://127.0.0.1:8000/Brook-ZzQq.github.io/knowledge/agent-mcp-bridge/
- http://127.0.0.1:8000/Brook-ZzQq.github.io/knowledge/python-async-boundaries/
- http://127.0.0.1:8000/Brook-ZzQq.github.io/playground/python/#async-wait

服务保持运行，停止时按Ctrl+C。端口8000被占用时，命令和网址一起改为8001。

源码ZIP含Liquid/Jekyll模板，Python只提供静态HTTP服务，不能把它们编译为
最终网页。不要直接用源码根目录的http.server地址当作已编译预览；也不要
双击HTML通过file协议预览依赖站点路径的资源。若启动服务时已经进入
Brook-ZzQq.github.io那层，则网址应去掉重复的项目名前缀；推荐统一使用上面的
目录层级，避免此前出现的404或原始黑白模板。

开发分支依次基于前一轮；最新27包含17–26的代码。CI产物默认保留7天，
过期后可在对应开发分支重新运行CI；不要因此更改生产Pages来源或直接推main。

循环实验底部可显式下载Python例子与配套公开目录。代码由你在自己的本地/
服务端安装固定SDK后运行；HTTP预览本身不执行Python，也不需要API Key。
实际项目测试只用假HTTP传输，没有验证真实模型或你的账户权限。

检索实验直接在浏览器运行，不需模型或Key。默认前两条含一个旧版片段；
改成v2后，手动放入两段试用/正式空间证据，观察完整引用文本的167字符。
语料和标注均为原创虚构教学材料，不是实际校园或产品规则。

文章目录可跳到本篇自解释问题，再用原生展开区换一个角度。第一条原有
问题和路线入口保留；这些操作不记录访问或完成。新接口教程可下载
SKILL.md格式示例，基础笔记可下载五案例任务卡。下载的是学习材料，
网页不会自动安装Skill、调用模型或连接MCP服务。

新Agent练习包从搭建文章简介下显式下载，再解压进入brooks-agent-starter目录。
Python3.11+，先按README安装固定openai3.50.0/httpx2 2.16.0；安装可能需要
包索引，之后离线演练无需Key或网络。脚本假响应经真实SDK返回，实际工具
执行，六项检查验证程序契约，不能当作模型成绩。网页本身不运行该项目。
源码ZIP、编译站点预览ZIP与文章内的Python练习包是不同文件，请按各自说明。

MCP文章另有原创brook-mcp-starter.zip，解压进入brooks-mcp-starter，按README
安装固定mcp2.3.0/httpx2 2.16.0后运行python client_check.py。客户端会启动本机
stdio子进程，实际发现/调用三项只读工具；无需模型Key，不要在浏览器打开server.py。
默认auto与显式legacy是两种已测模式，不能把版本标签或只读提示当作认证。

AI入口的第三段是宿主连接项目。下载brook-agent-mcp-bridge.zip后进入
brooks-agent-mcp-bridge，按README安装三个固定依赖并运行python demo_bridge.py。
它是真实SDK/本机协议与预写模型响应；batch --max-calls 1会以部分工作
和退出码1停止。不要把该结果写成真实模型、任务完成或服务端执行次数。

异步基础可以直接在浏览器预选，仍需自己点击加载解释器、运行代码。
两行JSON来自真实Python，分别显示取消与释放，不是模型推理。完成后
点“查看输出/错误”可到真实结果区；修改源代码时会说明旧结果尚未更新。
本机brook-python-async.zip只用Python3.11+标准库，进入brooks-python-async
运行python3 demo.py和python3 run_checks.py，不需要pip或Key。
