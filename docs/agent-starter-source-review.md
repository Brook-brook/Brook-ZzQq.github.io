# Agent搭建包：实际核对的来源

2026-11-14 Asia/Shanghai。搭建/测试笔记、fixture、打包/哈希校验和脚手架均
为本项目原创AI辅助工作，没有复制课程语料、Agent框架实现、图片或图标。

1. 原始agent_loop.py固定来自第二十三轮7a30e0e中的现有公开例子；打包
   输入直接指向同一文件，不在源码目录再维护一份。现有公式、参数、
   精确字段、回执和预算行为由此前真实SDK离线测试及本轮解压检查覆盖。
2. OpenAI Python3.50.0，原已核对固定59738a289ee82c7b86bf1e10230cceb6daa9716d，
   README/响应类型/输入上下文/错误与许可。实际SDK用于本轮内存假HTTP，
   没有真实模型或认证请求。Apache2全文随包，库distribution不被转存。
3. httpx2 2.16.0，实际安装metadata与上游tag固定提交
   6bfbf296bd87891287b3b0335493c7317be4ef18核对。完整LICENSE.md与
   src/httpx2/httpx2/_transports/mock.py均实际阅读；同步handle_request直接
   读请求、调用handler并检查Response，没有网络回退。本项目只使用API，
   未复制实现。BSD3完整保留Pydantic/Encode版权与免责声明。
4. 实际Requires-Python：openai>=3.10，httpx2 2.16.0>=3.11，所以新组合
   对使用者明确要求3.11+；实际执行Python3.12。直接依赖固定不等于把
   所有传递依赖或未来模型版本锁死，升级后仍需重新验证。
5. 资料为既有六点WGS84公开快照，检查日2026-11-02，OSM/Mapcarta引用
   和ODbL归属完整保留。没有新增或再次核实地点，更不代表道路/入口。

Agent运行与分层评测的原理来源延续已有固定Agents SDK64fbde5与
claude-cookbooks ce8b262；只作方法参考，不调用框架、远程tracing或其API
实验，也不复述历史分数作为本轮结果。完整下载内容逐条按显式输入/hash
检查；SHA不是作者签名，真实任务和模型表现不由程序fixture证明。
