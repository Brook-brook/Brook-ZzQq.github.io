# Brook的Agent × MCP连接练习

原创AI辅助教学项目。Python3.11+（实际3.12），固定openai3.50.0、mcp2.3.0、
httpx2 2.16.0。安装可能需要包索引；执行时实际SDK接收原创内存假响应，
通过真实本机MCP stdio调用三个固定只读GIS工具，没有模型、Key或远端端点。

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python demo_bridge.py
python run_checks.py
```

还可运行：

```sh
python demo_bridge.py --scenario batch
python demo_bridge.py --scenario batch --max-calls 1
python demo_bridge.py --scenario forbidden
python demo_bridge.py --scenario wrong-type
python demo_bridge.py --scenario empty
python demo_bridge.py --scenario repeating --max-requests 2
```

失败/到预算的退出码1是预期结果，不能当作成功完成。默认请求预算4、MCP
调用尝试预算3，均可取1–8整数；512是单次输出token上限，不是总费用预算。
20秒外层等待、5秒MCP读取、15秒SDK超时属于不同层；协作取消不保证硬实时
结束，也不能撤回已经发出的请求或读操作。

## 看清三个部分

- `provider_fixtures.py`：从已有原创演练脚本的三个明确函数/常量生成，
  内容预写；不是模型推理、远端录制或现实回答。
- `bridge.py`：宿主适配器核对实际发现/固定schema，用自己允许的三个
  工具和描述建立provider契约，整批查参数/调用ID，再按预算逐条MCP调用。
- `server.py`/`contracts.py`/`campus_tools.py`：复用上一包真实服务与受控
  提取的纯工具。MCP子进程不导入模型SDK，stdout只给协议。

provider的function_call.call_id由宿主带回function_call_output.call_id；
SDK另外管理MCP协议请求关联。客户端不伪造或把这两个ID当同一个。
必要的provider响应上下文（含加密reasoning状态）只用于下一次请求，
不写入公开trace；本练习不展示隐藏推理或原始提问。

## 读报告和停止状态

- provider_requests_attempted：已尝试SDK请求，不等于已收费或生成成功。
- mcp_call_attempts：客户端尝试协议工具调用，不冒充服务端已执行次数。
- receipts_accepted/rejected：回到宿主的对象经本例检查后接收/拒绝的数量。
- mcp_failures：SDK在传输/协议/输出schema层抛错，没有被当作已接收观察。
- observations：保留已接收的公开调用/结果，批次中途停止不补造其他回执。

检查先看is_error、text/structuredContent，再与同一小目录的确定性本地
参考完全对照。它不是通用MCP验证、服务执行证明或现实资料核实。形状
正确的999距离会被拒绝；最终文本仍answer_fact_checked:false。answered
只说明返回文本，默认文本本身清楚标记SCRIPTED FIXTURE。

通用BridgeRun无法认证调用者传入的provider是否做了推理，model_called为
null；只有本包明确使用MockTransport的演练才设为false。不要接入其他
client后沿用“没有模型”的标签。这里只提供离线模式，没有URL/Key输入。

12项实际SDK检查含真实stdio、单次批量/部分预算、整批拦截、必要响应
上下文、错误/坏回执、契约变动、未采用服务描述注入、空匹配与取消。
注入在测试内存层，与真实stdio正常路径分开，不宣称真实模型抗注入成绩。
取消异常向调用者传播，BridgeRun.report仍保留之前接收的读结果。

六点WGS84代表点沿用2026-11-02核对日、OSM/ODbL和每条来源。球面弧长
不是步行路线，目录空匹配不表示现实不存在。完整许可与生成SHA见NOTICE
和MANIFEST；哈希不是签名或身份认证。不是OS沙箱/远端认证/生产服务。
