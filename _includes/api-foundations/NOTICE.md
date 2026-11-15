# 来源与许可

程序、中文讲解、输入与检查为Brook原创AI辅助作品，按包内MIT许可发布。
没有复制上游实现、规范代码、图片、课程、用户输入或第三方distribution。

实际核对CPython3.11.18固定26badd80b6dc7786cd8fb63c3608a31f04754219：
Doc/library/json.rst的转换、hooks、NaN与重复名称；http.client.rst的阻塞
timeout；http.server.rst的本机服务与生产限制；http.rst的状态枚举。
https://github.com/python/cpython/tree/26badd80b6dc7786cd8fb63c3608a31f04754219/Doc/library
现有完整CPython-LICENSE.txt包含PSF、历史和文档代码0BSD条款；这里不
把CPython资料重许可为MIT，也没有转存Python解释器。

HTTP语义参考HTTPWG/http-core固定bde37f634681bd5462568b73aa722af9c9a3ef5e
中的RFC9110：9.2.2幂等、8.6 Content-Length、10.2.3 Retry-After、15.3.5
204。规范为2022年发布，不能称为本项目的新标准或模型接口。
https://github.com/httpwg/http-core/blob/bde37f634681bd5462568b73aa722af9c9a3ef5e/rfc9110.xml
其实际版权声明为2022 IETF Trust及文档作者，受BCP78/IETF Trust Legal
Provisions约束；抽取Code Components另要求Revised BSD许可。这里只作
事实参考与原创解释，不复制规范文本/代码，也不将整份规范标成MIT。
