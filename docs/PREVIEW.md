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

服务保持运行，停止时按Ctrl+C。端口8000被占用时，命令和网址一起改为8001。

源码ZIP含Liquid/Jekyll模板，Python只提供静态HTTP服务，不能把它们编译为
最终网页。不要直接用源码根目录的http.server地址当作已编译预览；也不要
双击HTML通过file协议预览依赖站点路径的资源。若启动服务时已经进入
Brook-ZzQq.github.io那层，则网址应去掉重复的项目名前缀；推荐统一使用上面的
目录层级，避免此前出现的404或原始黑白模板。

本轮PR14→15→16依次基于前一轮，最新16包含三轮代码。CI产物默认保留7天，
过期后可在对应开发分支重新运行CI；不要因此更改生产Pages来源或直接推main。
