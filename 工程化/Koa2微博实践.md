## ejs

### locals

当不确定后端是否会传递某变量时，可以在前面加上`locals.`

```ejs
<p>
  <%= locals.name %>
</p>
```

### 判断

```ejs
<p>
  <%= if (flag) { %>
  	<a>text</a>
 	<%= } %>
</p>
```

### 循环

```ejs
<%= list.forEach(item =>{)  %>
  	....
<%= } %>
```

### 组件

```ejs
<%- includes('widgets/component', {
  flag: flag
})>
```

## MySQL

### 语句

查询总数

```sql
select count(id) as sum from blogs
```

分页 （limit：每页两行，offset：跳过两行开始）

```sql
select * from blogs order by id desc limit 2 offset 2
```

外键 

foreign key设置

联表查询（利用users.id = blogs.userid条件联表查询users表中相关信息）

```sql
select * from blogs inner join users on users.id = blogs.userid
-- 外键约束（联表查询userid为1的数据）
select * from blogs inner join users on users.id = 1 and users.id = blogs.userid;
```

## ORM

用面向对象编程的思想，通过实例对象的语法来完成关系型数据库的操作。由此可以不用关心底层数据库，数据模型都统一定义在一个地方，方便更新维护；同时也有着更好的语义，容易理解；也可以在某种程度上避免了性能不佳的SQL语句。但是，ORM需要学习成本，对于复杂的查询，ORM有时候会无法表述或者不够灵活，或者是性能不如原生SQL。

### 优势

- 数据模型都在一个地方定义，更容易更新和维护，也利于重用代码。
- ORM 有现成的工具，很多功能都可以自动完成，比如数据消毒、预处理、事务等等。
- 它迫使你使用 MVC 架构，ORM 就是天然的 Model，最终使代码更清晰。
- 基于 ORM 的业务代码比较简单，代码量少，语义性好，容易理解。
- 你不必编写性能不佳的 SQL。

### 缺点

- ORM 库不是轻量级工具，需要花很多精力学习和设置。
- 对于复杂的查询，ORM 要么是无法表达，要么是性能不如原生的 SQL。
- ORM 抽象掉了数据库层，开发者无法了解底层的数据库操作，也无法定制一些特殊的 SQL。

### sequelize工具

数据表，用JS中的模型（class或对象）代替

记录通过一个对象或数组代替

sql语句用对象方法代替

#### 类型

| Sequelize | MySQL        |
| --------- | ------------ |
| STRING    | varchar(255) |
| INTEGER   | INT          |

#### 定义数据模型 Model

```js
const Sequelize = require('sequelize')
const seq = require('./seq') // Sequelize 实例

const User = seq.define('user', {
  // id自增，并设为主键
  username: {
    type: Sequelize.STRING,
    allowNull: false
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false
  },
  nickname: {
    type: Sequelize.STRING
  }
  // 自动创建 createdAt 和 updatedAt
})
```

#### 增

create API，返回新增对象信息（zhangsan.dataValues） 

```js
const zhangsan = await User.create({
    username: 'zhangsan',
    password: '123',
    nickname: '张三'
 })
```

#### 改

update API，数组形式返回改变行。

```js
const updateRes = await User.update({
    nickname: '张三'
  }, {
    where: {
      username: 'zhangsan'
    }
  })
```

#### 查

单条查询：findOne；列表查询：findAll；列表带总数查询：findAndCountAll

```js
// 单条
const zhangsanName = await User.findOne({
  attributes: ['username', 'nickname'],
  where: {
     username: 'zhangsan'
  }
})
// 查询列表
const zhangsanBlog = await Blog.findAll({
  // 分页
  limit: 2, // 限制条数
  offset: 0
  where: {
    userId: 1
  },
  order: [
    ['id', 'desc']
  ]
})
// 总数 返回对象：rows：数组行；count 总数
const blogCount = await Blog.findAndCountAll({
  order: [
    ['id', 'desc']
  ]
})

```

#### 删

destroy API，返回被删除数组

```js
const blogRes = await Blog.destroy({
  where: {
    id: 1
  }
})
```

#### 联表查询

设置 foreign key

```js
// belongsTo 多对一
Blog.belongsTo(User, {
  foreignKey: 'userId'
})

// hasMany 一对多
User.hasMany(UserRelation, {
  foreignKey: 'userId'
})

// 二者区别在于使用前者查询带出后者相关信息
```

查询语句使用 include

```js
const result = await Blog.findAndCountAll({
    limit: pageSize,
    offset: pageSize * pageIndex,
    order: [
      ['id', 'desc']
    ],
    include: [
      {
        model: User,
        attributes: ['username', 'nickname', 'picture'],
      },
      {
        model: UserRelation,
        where: {
          userId
        }
      }
    ]
  })
```



## Node与MySQL 连接池

之所以用连接池，是因为频繁的建立、关闭连接，会极大的减低系统的性能。使用连接池可以减少数据库连接的创建，生成连接给用户使用，一直存在于内存中。

本地开发中使用连接池会不便于问题定位，机制复杂。

```js
if (isPrd) {
  // 线上环境 - 连接池配置
  conf.pool = {
    max: 5, // 连接池允许最大连接数量
    min: 0,
    idle: 10000 // 10s 之内没有被使用则释放
  }
}
```

## Redis

应用：不因用户而有区分的公共数据（比如微博的热搜榜）；性能要求高的场景例如如登录

session适用于redis的原因

+ session访问频繁，对性能要求高
+ session可不考虑断电丢失数据的问题
+ session数据量相比于mysql中存储的数据，不会太大

## Cookie与Session

session是存储在server端的用户信息集合，客户端通过cookie中携带的用户标识字段从session中获取对应用户的数据信息。

当检查到cookie中没有不携带该标识，则会在返回的header中插入，下次请求时便会携带上该字段。

cookie中的用户标识name与redis中的key相同，即通过key来获取redis的val（用户信息相关）。

在Koa中，session的实现基于koa-redis与koa-generic-session依赖实现：

```js
const session = require('koa-generic-session')
const redisStore = require('koa-redis')
const { REDIS_CONF } = require('./config/db') //redis 配置

// session 配置
app.keys = ['Wypdate_123#'] // 密匙
app.use(
  session({
    key: 'weibo.sid', // cookie name，默认为 `koa.sid`
    prefix: 'weibo:sess', // redis key 前缀。默认为 `koa:sess:`
    cookie: {
      path: '/',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 单位 ms
    },
    // ttl: 24 * 60 * 60 * 1000, // redis 过期时间，默认于cookie.maxAge相同
    store: redisStore({
      all: `${REDIS_CONF.host}:${REDIS_CONF.port}`
    })
  })
)
```

session是有状态的，一般存放在服务器内存或硬盘中，当服务器采用分布式或集群时，会产生负载均衡的问题。因为多服务器不共享session，可以通过将session存放在一个服务器中，但是这样做就不能够完全达到负载均衡的效果。

[session负载均衡解决办法](https://blog.51cto.com/zhibeiwang/1965018)

+ session保持：在进行请求分发的时候，保证每个客户端固定访问后端的同一台服务器。可以通过Nginx实现（ip_hash和url_hash）。缺点在于无法实现负载的绝对均衡；如果连接的服务器宕机，则session丢失，用户仍需要重新登录。
+ session复制：将每个应用服务器中的Session信息复制到其它服务器节点上。基于Tomcat中IP组播实现。局限在于不太适合大的集群。
+ session共享：当session放在一个统一的地方，所有节点都在一个地方进行存取。例如redis。

## JWT（json web token）

用户认证成功（登录）之后，server断返回一个加密的token给客户端。客户端后续每次请求都携带token（放在header或cookie中），表示当前用户身份。

### 构成

+ 头部：typ（token类型，固定为jwt） + alg（hash算法）
+ 有效载荷（payload）：存储需要传递的信息，用户ID、用户名等。还包含元数据，如过期时间等。可加密，不单单是作64baseURL编码
+ 签名：对头部与payload进行签名，保证token在传输的过程中没有被篡改或损坏。

### 适用场景

+ 一次性验证，如激活账号邮件中的链接，一般这样的链接有用户标识与时效性，结合jwt中固定参数与exp过期时间等等。
+ RESTful 无状态验证

### jwt vs. Session

|                | JWT                                                          | session                                           |
| -------------- | ------------------------------------------------------------ | ------------------------------------------------- |
| 存储           | 客户端                                                       | 服务端，依赖于redis                               |
| 是否依赖cookie | 否                                                           | 是                                                |
| 是否支持跨域   | 是                                                           | 否                                                |
| 适用系统       | 服务节点较多，跨域较多的系统                                 | 统一的web服务，server端需要严格管理用户信息的场景 |
| 缺点           | 1、如果用户信息过多在jwt中，http请求增加开销；2、仅能在过期后才能销毁（想要降级某些账号权限、修改密码后仍可以保持登录）； |                                                   |

### koa中的应用

#### koa-jwt

使用该中间件会检查 `Header` 首部中的 token，是否存在、是否有效。如果没有token或token不正确（失效），会给出对应的错误信息（401）。

```js
app.use(
	jwtKoa({
		secret: 'wyp123'
	}).unless({
		path: [/^\/users\/login/] // 自定义忽略 jwt 验证目录
	})
)
```

其中screct为加密key，解密时也需要，因此做好存放于全局配置中。不局限于字符串，也可以是一个文件（例如.pub）。

useless()方法用于设置哪些路由api不需要通过token校验。通常作用于登录与注册页面。

### jsonwebtoken

该依赖用于生成token并返回给客户端，通常作用在登录接口中。在之后的http请求中，客户端都需要将token添加在http Header `Authorazition: Bearer token`中。

```js
const jwt = require('jsonwebtoken')

// ...

router.post('/login', async (ctx, next) => {
	const { username, password } = ctx.request.body
	// 模拟登录验证
	if (username === 'zhangsan' && password === 'abc') {
		const userInfo = {
			userid: 1,
			nickname: '张三'
    }
    const token = jwt.sign(userInfo, 'wyp123', { expiresIn: '1h' })
		ctx.body = {
			errno: 0,
			data: token
		}
	} else {
		ctx.body = {
			errno: 1,
			msg: '登录失败'
		}
	}
})
```

jwt.sign方法接受四个参数：`jwt.sign(payload, secretOrPrivateKey, [options, callback])`。

payload为加密的信息

secretOrPrivateKey参数secret与koa-jwt中的**secret**

options中可配置过期时间expiresIn等

## *Jest单元测试工具

给定输入，得到输出。观察输出是否符合要求。意义在于能够一次性执行完所有单元测试，短时间内验证所有功能是否正常。

Jest 是 Facebook 出品的一个测试框架，相对其他测试框架，其一大特点就是就是内置了常用的测试工具，比如自带断言、测试覆盖率工具，实现了开箱即用。

需要安装jest、supertest(测试http请求)依赖。

对应的package.json:

```json
"scripts": {
    "test": "cross-env NODE_ENV=test jest --runInBand --forceExit --colors"
}
```

单元测试文件存放于根目录下test文件夹中，后缀统一为`.test.js`。这样才能够被`jest`识别并执行。

单元测试文件中默认可使用test函数表示一组测试用例。其第一个参数为测试的名称，第二参数是执行的函数。断言库使用expect。

```javascript
test('1 + 1 = 2', () => {
  expect(add(1, 1)).to.be.equal(2);
})
```

测试http请求

```js
// test/server.js
const request = require('supertest')
const server = require('../src/app').callback() // koa 实例 callback: 适用于 http.createServer() 方法的回调函数来处理请求。

module.exports = request(server)

// test/json.test.js 路由 /json 测试
const server = require('./server')

test('json feedback is correct', async () => {
  // get 请求
  const res = await server.get('/json')
  expect(res.body).toEqual({
    title: 'koa2 json'
  })
})
```

## 技术方案设计

### 架构设计

1. routes层
   + 页面
   + API
   + 校验（JSON schema）
2. controller层
   + 业务逻辑，函数命名适当带有业务关联
   + 返回格式（成功、失败返回格式）
3. service层
   + 数据处理（编写ORM语句） 函数命名避免带有业务逻辑，尽量以增删改查命名
   + 格式化

![image-20200412093210632](/Users/mac/Library/Application Support/typora-user-images/image-20200412093210632.png)

### 数据模型设计

![image-20200412093520914](/Users/mac/Library/Application Support/typora-user-images/image-20200412093520914.png)