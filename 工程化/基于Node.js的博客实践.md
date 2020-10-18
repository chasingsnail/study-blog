# 前置知识

## Nodejs、JS、ES区别

ES为语法规范，定义了语法、循环、判断、原型、闭包等等。nodejs与js遵循该规范。

js结合了ES与web API（操作DOM、ajax请求等），由此具备了在浏览器中进行操作的能力。

nodejs结合了ES与Node API（处理文件、处理http等），由此可以完成server端的操作。

## server端开发中的注意点

### 考虑内存与CPU优化与扩展

cpu与内存为稀缺资源。使用stream写日志，redis来存储session。

### 日志记录

记录、存储、分析

### 安全

### 集群与服务拆分

流量增大后，需要扩展以及拆分服务来承载

## MySQL

Mysql属于硬盘数据库。Redis属于内存数据库。

### 数据类型

+ int 数字类型，如id
+ varchar(xx) 有限文本(xx不区分中文英文数字，长度统一化)，如用户名
+ bigint 较大的数值，如时间戳
+ longtext 长文本，如文章内容

### 配置列

+ pk 主键
+ nn 不为空
+ AI 自动增加
+ default 默认值

### 常用sql语句

假设有一张user表，列项为id、username、password、realname。

tip: 等于 =  | 不等于 <>

#### 增加

```mysql
use myblog

-- 插入行数据(password为关键词，遂用引号包裹)
insert into users(username,`password`,realname) values('zhangsan','123','张三')
```

#### 查询

```mysql
use myblog

-- 查询user表所有列
select * from users;

-- 查询user表指定列
select id,username from users;

-- 查询user指定行(与、或、模糊搜索)
select * from users where username='zhangsan' and `password`='123';
select * from users where username='zhangsan' or `password`='123';
select * from users where username like '%zhang%';

-- 查询user表按id正、倒叙排列
select * from users order by id;
select * from users where username='zhangsan' order by id desc;

```

#### 更新

```mysql
use myblog

-- 更新数据
-- safe mode fix
SET SQL_SAFE_UPDATES = 0;

-- 更新指定行数据
update users set realname='李四2', content='aaa' where username='lisi';


```

#### 删除

```mysql
use myblog

-- 删除
-- 删除所有(better not)
delete from user;

-- 删除指定条件行 (实际应用中利用额外字段例如state来控制,利用update去更新该字段)
delete from user where username='zhangsan';


```

### 连接Node

首先通过npm安装mysql模块包。

#### 连接常见问题

在通过mysql模块连接本地数据库时可能会有如下报错：

Error: ER_NOT_SUPPORTED_AUTH_MODE: Client does not support authentication protocol requested by server; consider upgrading MySQL client

这是由于最新的mysql模块并未完全支持MySQL 8的“caching_sha2_password”加密方式，而“caching_sha2_password”在MySQL 8中是默认的加密方式。因此，下面的方式命令是默认已经使用了“caching_sha2_password”加密方式，该账号、密码无法在mysql模块中使用。

解决办法为修改密码显示指定为使用“mysql_native_password”的加密方式。

在workbench中输入：

```mysql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'YOUR_PASSWORD';

FLUSH PRIVILEGES;
```

## 登录模块

核心：登录校验与登录信息存储

### cookie

+ 存储在浏览器的一段字符串（5kb）
+ 跨域不共享
+ 每次发送http请求，会将**请求域**的cookie发送到server
+ server端可修改cookie并返回给浏览器
+ 浏览器也可以通过js修改cookie（有限制）

#### 操作

#### 客户端

```js
// 该方式是累加的行为，自动添加到已有cookie尾端
document.cookie = 'a=1';
```

#### server端

可针对cookie修改作出限制

+ httpOnly： 仅允许server端修改cookie
+ expires： 设置cookie过期时间

### session

server端存储用户信息，解决cookie中存储用户信息不安全的问题。

通常使用cookie中存放uid，并在服务端作uid到用户信息（如username等）的映射，同时其可以存储较大的数据。

## redis

缓存数据库，数据存放于内存中，读写快。

缺点：断电丢失（可通过配置备份）、内存昂贵空间少。

### 使用背景

+ 单个进程内存分配有限，如访问量过大则会产生问题。
+ 正式生产环境的运行是多进程的，不同进程之间数据不共享。

### 为何适用于session（对比于MySQL）

+ 访问频繁，对于性能要求高
+ session可以不考虑断电丢失问题 ，重新登录即可解决
+ session数据量不大

## 日志

日志文件大，不适合放入redis中；mysql中适用于多表联动查询的场景；存储到文件中成本最低，可放置在不同服务器上。

### fs

### stream（优化内存GPU）

背景：IO性能瓶颈；解决在有限资源下最大限度提高IO效率

### 日志拆分 crontab

不直接使用node.js实现的原因在于 Node 是一个进程，定时任务需要执行时要保证这个进程在运行。shell脚本的形式为操作系统来执行，成本更低。



## 安全

### sql注入（数据库窃取）

方式：输入一个sql片段，拼接成一段攻击代码

预防：mysql的escape函数处理输入内容

### xss攻击（cookie窃取）

方式：页面展示参杂js代码以获取页面信息

预防：转换生成js的特殊字符如<, >等

### 密码加密

方式：获取用户名密码

预防：密码加密

## Express

### 404页面处理

统一在所有路由中间件**之后**加404捕获中间件，当前面没有任何一个路由可以处理时，便会走到该中间件。

```js
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
```

### 中间件

 

## PM2

一个进程管理工具，用于管理node进程并查看其状态。

作用：进程守护；启动多进程，充分利用CPU和内存；日志记录

### 常用命令

list ：进程列表  restart： 重启服务 stop：终止服务 delete：删除服务 info：查看进程详细信息 log：查看进程日志 monit： 生成监控实时界面

### 进程守护

进程崩溃时，自动重启。

可通过info命令中restart列查看到重启次数。

### 配置文件

```json
// 常用配置
{
  "apps": {
    "name": "pm2-test-server", // app-name
    "script": "index.js", // 启动文件
    "watch": true, // 监听文件修改
    "ignore_watch": [ // 监听忽略文件
      "node_modules",
      "logs"
    ],
    "error_file": "logs/err.log", // 错误日志存放路径
    "out_file": "logs/out.log", // 输出日志存放路径
    "log_date_format": "YYYY-MM-DD HH:mm:ss" // 时间戳格式
  }
}
```

### 多进程的使用

+ 操作系统限制一个进程的内存
+ 无法充分利用机器全部内存
+ 也无法利用多核CPU的优势
+ 多进程之间内存无法共享，可通过使用redis解决，实现数据共享

# 存疑

+ mysql：基本操作、不同数据库类型对比（关系型、NoSql等）
+ redis：基本操作、npm redis依赖包的api、与mysql的对比等等
+ Node中http模块、fs模块、path模块、stream、加载静态资源
+ Express：中间件机制，express-session
+ cookie、session
+ 日志拆分crontab及相关shell命令

# 原生代码开发



# 框架代码开发

# 线上部署