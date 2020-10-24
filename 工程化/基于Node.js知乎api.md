## REST

### 6个限制

+ C/S
+ 无状态
+  缓存
+ 统一接口
+ 分层系统
+ 按需代码

### 请求规范

+ URI使用名词，尽量用复数 /users
+ URI使用嵌套表示关联关系 /users/12/repos/5 
+ 正确使用HTTP方法
+ 不符合CRUD情况：POST /action/子资源

### 安全

+ https
+ 鉴权
+ 限流（防止恶意攻击）

## HTTP Options

### 作用

+ 检测服务器所支持的请求方法（Allow字段）
+ CORS中的预检请求

### Koa-router中的allowedMethods

+ 响应options方法，告诉它所支持的请求
+ 相应地返回405（不允许）和501（未实现），koa-router仅支持post、get、put等基础请求，若使用例如LINK请求方法，则会返回501

## CURD返回最佳实践

### 新建

新建用户信息

### 查询

用户信息列表

### 修改

修改后对象

### 删除

状态码204，返回为空