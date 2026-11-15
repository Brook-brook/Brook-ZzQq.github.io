# SQLite恢复练习：来源、许可与实际证据

2026-11-15。这里只研究一个数据库中的计数与回执，不把它称为完整Agent
checkpoint、跨服务事务、数据库导入验证器或生产耐久性保证。

## 实际阅读

- [CPython3.11.18 sqlite3.rst](https://github.com/python/cpython/blob/26badd80b6dc7786cd8fb63c3608a31f04754219/Doc/library/sqlite3.rst)，固定26badd80b6dc7786cd8fb63c3608a31f04754219：connect/timeout、isolation_level=None、显式事务、commit/rollback/close和参数占位符。
- [SQLite pager-invariants.txt](https://github.com/sqlite/sqlite/blob/e5cb4b09573aeb53cbb28983be7234e42c48c07a/doc/pager-invariants.txt)，固定e5cb4b09573aeb53cbb28983be7234e42c48c07a：回滚日志、同步、文件页、事务边界与锁不变量的完整文件。
- 同一SQLite固定提交的完整[LICENSE.md](https://github.com/sqlite/sqlite/blob/e5cb4b09573aeb53cbb28983be7234e42c48c07a/LICENSE.md)：核心源码与最终SQLite实现声明public domain，但仓库的配置/构建辅助脚本有BSD类例外。

sqlite.org/lang_transaction.html和copyright.html在当前网络均返回403。
未声称读取这些网页，也没有用代理绕过；以上实际可读固定源与本机运行
分别记录。没有将“仓库最新提交”当成正在使用的SQLite版本。

## 原创代码的边界

SQL与Python、六个案例、检查和说明均为Brook原创AI辅助材料。没有复制
上游实现、SQL模板、规范正文、数据库文件或第三方distribution。程序只
使用系统Python带的sqlite3；精简构建缺少它时不能假报运行成功。

初始化通过O_EXCL只创建新文件，恢复连接使用mode=rw拒绝错误路径创建
新空库。schema版本与计数/回执关系不一致会报错，不清空原文件。该限制
针对自己的教学文件，不是任意外来SQLite文件的通用安全校验。

显式BEGIN IMMEDIATE后先读一致快照，再更新counter、插入receipt并COMMIT。
同key同参数重放，改参数冲突，新key新操作。读两表也有读事务；重开时
SQLite可能处理自己的日志，不能把“没有增加计数”说成没有任何文件I/O。

故障只由内部worker安装：在提交前/后调用真实os._exit(75)，跳过Python
finally且不返回回执。parent随后启动新子进程并重开同一临时文件；不是
清空变量后将它称作重启。客户端空回执与教学观察者看到的文件状态分开。
重复重放也能再次丢回执；提交后的异常不会撤销已提交效果。

所有数据库均由demo/test自己新建并清理，没有用户数据库、学习手记、
模型、HTTP或外部动作。计数和回执同一文件事务的范围，不涵盖邮件、
发布或远端写工具，也不自动恢复模型消息、权限、预算或待核对状态。

## 实际执行

| 运行 | 真实版本与约束 | 实际结果 |
| --- | --- | --- |
| 本机解压9-entry公开ZIP | CPython3.12.14、SQLite3.53.1，-I -S -B | 八项检查、六段CLI均通过；真实子进程退出/重开与SQLite文件 |
| 同一ZIP受限容器 | CPython3.11.18、SQLite3.46.1、UID10001、禁外网、只读根、仅挂载公开ZIP、临时/tmp | 同八项检查与六段CLI实际通过，未导入site或SDK |

同一ZIP为17901字节，SHA256：
`8604440319c5c08477b8e78e4660e427e95d05b523dceb8936c120c1adac8d31`。
清单逐文件与公开源核对。版本、退出码、回执与文件结果来自实际运行，
哈希不认证作者或服务。网页仅提供教程/下载，不运行这些进程或数据库。

实际检查包括：提交前/后退出、重复回执丢失、提交前异常回滚、提交后
异常仍已提交、同key冲突、新key/历史快照、两个独立子进程同key、拒绝
覆盖/错误恢复路径和不一致版本/记录。没有测试机器断电、磁盘损坏、
网络文件系统、所有锁调度或全部VFS恢复路径。

## 完整许可

新项目采用Brook MIT。完整现有CPython-LICENSE.txt和实际SQLite源仓库
LICENSE.md都在显式ZIP中，后者在仓库为licenses/SQLite-SOURCE-LICENSE.md。
没有转存Python解释器、SQLite二进制、上游源码或有例外的构建脚本；
不把整份SQLite仓库无条件称为public domain或重许可成MIT。

[交付记录](ATLAS-ITERATION-29.md)包含最终构建/浏览器/终审结果；
[合规记录](iteration-29-compliance.md)统一说明学习记录与公开展示边界。
