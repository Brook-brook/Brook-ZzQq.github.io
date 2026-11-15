# 来源与范围

程序、SQL语句、输入、六个情景、中文说明和检查为Brook原创AI辅助材料，
按MIT发布。没有复制上游实现、SQL模板、文档正文或第三方distribution。

2026-11-15实际阅读CPython3.11.18固定
26badd80b6dc7786cd8fb63c3608a31f04754219的Doc/library/sqlite3.rst：
connect、isolation_level=None、显式事务、commit/rollback/close和占位符。
https://github.com/python/cpython/blob/26badd80b6dc7786cd8fb63c3608a31f04754219/Doc/library/sqlite3.rst
完整CPython实际许可随包保留；不转存Python解释器或SQLite二进制。

实际阅读SQLite源仓库固定e5cb4b09573aeb53cbb28983be7234e42c48c07a的
doc/pager-invariants.txt及完整LICENSE.md，后者随包保存。核心代码声明为
public domain，但该仓库仍有配置/构建脚本等BSD类例外，不能称整个仓库
所有文件都无条件public domain。本项目没有复制那些源码或构建脚本。
https://github.com/sqlite/sqlite/tree/e5cb4b09573aeb53cbb28983be7234e42c48c07a

sqlite.org公开事务/版权页面在当前网络返回403，未把它们声称为已读取。
以上固定源与CPython文档、实际本机结果分别记录；没有绕过网络限制。
运行使用系统Python自带SQLite，JSON会报告实际版本，不是编译该固定提交。

进程中断、数据库提交、回执观察和外部副作用有不同范围。本例没有模型、
HTTP、真实发布、私有手记或生产数据。测试不代表断电/VFS/分布式可靠性。
