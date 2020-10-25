## 类型

基础类型：undefined、null、string、boolean、number、symbol

引用类型：object（function、object、array）

### 隐式转换

##### 转换为原始值 toPrimitive()

+ 当对象类型需要被转为原始类型时，它会先查找对象的`valueOf`方法，如果`valueOf`方法返回原始类型的值，则`ToPrimitive`的结果就是这个值
  + Number、Boolean、String 会返回相应的原始值
  + Date 类型转换为数值，即毫秒
  + 其余类型会返回 this，即自身
+ 如果`valueOf`不存在或者`valueOf`方法返回的不是原始类型的值，就会尝试调用对象的`toString`方法，也就是会遵循对象的`ToString`规则，然后使用`toString`的返回值作为`ToPrimitive`的结果。
  + Number、Boolean、String、Array、Date、RegExp、Function 转换后为相应的字符串形式
  + 其余返回该对象的类型，例如 `[Object Object]`

##### 转换为数字 toNumber()

+ null： 转为0
+ undefined：转为NaN
+ 字符串：如果是纯数字形式，则转为对应的数字，空字符转为0, 否则一律按转换失败处理，转为NaN
+ 布尔型：true和false被转为1和0
+ 数组：数组**首先会被转为原始类型**，也就是 ToPrimitive，然后在根据转换后的原始类型按照上面的规则处理，关于ToPrimitive，会在下文中讲到
+ 对象：同数组的处理

```js
  Number(null) // 0
  Number(undefined) // NaN
  Number('10') // 10
  Number('10a') // NaN
  Number('') // 0 
  Number(true) // 1
  Number(false) // 0
  Number([]) // 0
  Number(['1']) // 1
  Number({}) // NaN
```



##### 转换为字符串 toString()

将其他类型转换为字符串。

```
null：转为"null"
undefined：转为"undefined"
布尔类型：true和false分别被转为"true"和"false"
数字类型：转为数字的字符串形式，如10转为"10"， 1e21转为"1e+21"
数组：转为字符串是将所有元素按照","连接起来，相当于调用数组的Array.prototype.join()方法，如[1, 2, 3]转为"1,2,3"，空数组[]转为空字符串，数组中的null或undefined，会被当做空字符串处理
普通对象：转为字符串相当于直接使用Object.prototype.toString()，返回"[object Object]"

  String(null) // 'null'
  String(undefined) // 'undefined'
  String(true) // 'true'
  String(10) // '10'
  String(1e21) // '1e+21'
  String([1,2,3]) // '1,2,3'
  String([]) // ''
  String([null]) // ''
  String([1, undefined, 3]) // '1,,3'
  String({}) // '[object Objecr]'
```

### == 宽松判断

![](https://zhangzhao.name/images/truth-table.png)

+ 当 Object 与字符串、数字、布尔值（转数字）比较时，通常会将 Object 进行 toPrimitive 转化为原始类型。
+ 非 undefined、null 类型的普通类型比较时，在非同类型相比的情况下，会将自身转换为 Number 类型
+ == 与 === 的区别主要在于隐式转换

## This

### this 的指向

+ 总是指向调用它所在方法的对象，在运行时基于函数的执行环境绑定的。

+ 默认绑定指向全局，严格模式下为undefined。

+ 隐式绑定是作为对象的方法，将其绑定到该对象上。

+ 通过call、apply等方法将this绑定到指定的对象上。**（第一个参数为null、undefined会被忽略，指向全局对象，如果为原始类型值，则会通过Object()转化为对象形式）**。

+ new 绑定，指向创建的新对象。

+ setTimeout的回调函数中，this使用的是默认绑定，即指向全局对象。

+ 箭头函数的this继承于它外面第一个非箭头函数的函数的this指向，一旦绑定了上下文后就不会被改变。

### new 的过程中发生了什么

1. 创建一个新的对象
2. 将构造函数的作用域赋值给这个新的对象（this指向该对象）
3. 执行构造函数中的代码
4. 若函数没有返回对象（Object），则会返回该新对象

```js
// 模拟 new 
function createNew(constructor, ...arg) {
	let o = new Object()
	constructor.apply(o, arg)
	o.__proto__ = constructor.prototype // setPrototypeOf(o, constructor.prototype)
	return o
}
```

### bind 源码的实现

```js
function.bind(thisArg[, arg1[, arg2[, ...]]])
```

返回一个原函数的拷贝，并拥有指定的this值和初始参数。

```js
var slice = Array.prototype.slice;
Function.prototype.myBind = function() {
  let func = this;
  let oThis = arguments[0];
  let aArgs = slice.call(arguments, 1);
  if (typeof func !== 'function') {
    throw new TypeError('xxx');
  }
  return function() {
    const args = aArgs.concat(slice.call(arguments));
    return func.apply(oThis, args);
  };
};
```

该实现不完善的地方在于，返回的函数若被用作 new 的构造函数，则其 this 并未指向 new 实例对象。

### call 源码实现

```js
Function.prototype.myCall = function(ctx, ...arg) {
  if (ctx === null || ctx === undefined) {
    ctx = window;
  } else {
    Object(ctx);
  }
  const tempProto = Symbol('fn');
  ctx[tempProto] = this;
  const result = ctx[tempProto](...arg);
  delete ctx[tempProto];
  return result;
};
```

### apply源码实现

apply第二个参数接受一个**数组或类数组**

```js
Function.prototype.myApply = function(ctx) {
  if (ctx === null || ctx === undefined) {
    ctx = window;
  } else {
    Object(ctx);
  }
  // 判断是否为数组或类数组
  function isArrayLike(o) {
    return (
      o &&
      isFinite(o) &&
      o.length >= 0 &&
      o.length === Math.floor(o.length) &&
      o.length < Math.pow(2, 32)
    );
  }

  const tempProto = Symbol('temp');
  ctx[tempProto] = this;
  let result;

  const arg = arguments[1];
  var isValidArg = Array.isArray(arg) || isArrayLike(arg);
  if (!isValidArg) {
    throw new TypeError('error');
  }
  if (arg) {
    args = Array.from(args);
    result = ctx[tempProto](...arg);
  } else {
    result = ctx[tempProto]();
  }
  delete ctx[tempProto];
  return result;
};
```

### this的设计

由于 JavaScript 允许在函数体内部，引用当前环境的其他变量，则需要一种机制能够在函数内部获得当前运行环境，由此产生了 this，它用来指代函数当前的运行环境。

例如obj.foo()是通过obj来找到foo的，因此是在obj环境。一旦通过赋值 var foo = obj.foo，则变量foo直接指向了函数存放地址本身，因此是在全局环境中执行。

## 箭头函数

+ 函数体内的 this 是定义时所在的对象，不是使用时所在的对象

  `this`指向的固定化，并不是因为箭头函数内部有绑定`this`的机制，实际原因是箭头函数根本没有自己的`this`，导致内部的`this`就是外层代码块的`this`。

+ 不可以当成构造函数，即不可用 new 命令

+ 不可以使用 arguments 对象，因为在对象函数体内不存在。可以用 rest 参数代替

+ 不可以用 yield 命令，即不能作为 generator 函数

## 作用域与闭包

### 函数生命周期

函数声明会被提前，然后再执行业务代码。当函数执行完成推出后，释放该函数的上下文环境并注销该函数的局部变量。如果变量名和函数声明相同是，函数优先声明。

### AO与VO

VO（变量对象）对应函数创建阶段，在解析时，所有的变量和函数声明统称为VO。

- 变量 (var, 变量声明);
- 函数声明 (FunctionDeclaration, 缩写为FD);
- 函数的形参

AO（活动对象）对应函数执行阶段，当函数被调用时，会创建一个执行上下文。该执行上下文包含了所有函数需要的变量，这些变量共同组成了一个新的对象就是AO（函数的所有局部变量、参数、this等）。

- 函数的所有局部变量
- 函数的所有命名参数
- 函数的参数集合
- 函数的this指向

### 什么是作用域链

当代码在一个环境中创建时，会创建变量对象的一个作用域链（scope chain）来保证对执行环境有权访问的变量和函数。作用域第一个对象始终是当前执行代码所在环境的变量对象（VO）。如果是函数执行阶段，那么将其activation object（AO）作为作用域链第一个对象，第二个对象是上级函数的执行上下文AO，下一个对象依次类推。

当查找变量的时候，会先从（定义时已确定）当前上下文的变量对象中查找，如果没有找到，就会从父级(**词法层面**上的父级，即创建该函数的作用域)执行上下文的变量对象中查找，一直找到全局上下文的变量对象，也就是全局对象。这样由多个执行上下文的变量对象构成的链表就叫做作用域链。

```js
var x = 100
function fn() {
  console.log(x)
}

function show(f) {
  var x = 10
  f()
}
show(fn) // 100
```

### 如何理解闭包

能够访问另一个函数作用域中变量的函数（绑定了执行环境的的函数）。在闭包内部可以访问外部环境的变量对象。闭包只存储外部变量的引用（经典for循环问题，打印出最后一个i）。在函数调用完成后，其执行上下文环境不会被销毁。

### 闭包的作用

一般是通过立即执行函数创建闭包，可以通过闭包来达到封装性，创建私有状态。

+ 私有变量和临时作用域
+ 柯里化对参数进行缓存（例如 Vue 中的 patch 函数）



## 原型与继承

### 原型

创建的每个函数都有一个 prototype 属性，这个属性指向一个原型对象，包含了所有该函数创建实例所共享的属性与方法。

### 原型链

每个对象拥有一个原型对象，通过`__proto__`指针指向上一个原型，并从中继承方法和属性，同时原型对象也可能拥有原型，这样一层一层，最终指向 null。这种关系被称为**原型链**。当我们访问对象的一个属性的时候，会先在自身查找，如果自身没有，则会沿着原型链一直往上查找，有则返回，无则返回 undefined。

### 继承的作用

单独的数据层面可以通过赋值来实现，行为层面可以直接调用函数，当两者都需要被组合复用时，需要通过继承来满足需求。

### 继承方式

#### 原型链继承

通过将父类的实例赋值给子类构造函数的原型来实现，由此构成子类实例与子类原型，子类原型到父类原型的链条。

```js
function SuperType() {
    this.status = true
}
SuperType.prototype.getStatus = function() {
    return this.status
}
function SubType() {
    this.subStatus = false
}
SubType.prototype.getSubStatus = function() {
    return this.subStatus
}

SubType.prototype = new SuperType()
var foo = new SubType()
```

问题在于，如果原型中含有引用类型的值，通过实例对其进行修改的时候，会影响到其他实例。如果其他实例中存在和原型上同名的属性，则不会收到影响。

#### 借用构造函数继承

通过在子类的构造函数中调用父类的构造函数，通过call、apply方法实现。

```js
function SuperType() {
    this.status = true
}
SuperType.prototype.getStatus = function() {
    return this.status
}
function SubType() {
    SuperType.call(this)
}
SubType.prototype.getSubStatus = function() {
    return this.subStatus
}

var foo = new SubType()
```

相比原型继承，这种继承方式可以使得每一个实例都拥有自己的属性，同时可以在子类构造函数中向父类构造函数传递参数。 

问题在于只能够继承父类实例的属性与方法，无法继承父类原型的属性与方法。由于方法都在构造函数中定义，则不能实现函数的复用。

#### 组合继承

通过原型继承方式继承父类原型属性与方法，通过借用构造函数继承方式继承父类实例的属性。

```js
function Super() {
  this.name = ['Mike', 'David']
}
Super.prototype.addname = function (name) {
  this.name.push(name)
}
function Sub() {
  Super.call(this) // 第二次调用 Super()
}
Sub.prototype = new Super() // 第一次调用 Super()
Sub.prototype.constructor = Sub
Sub.prototype.getName = function() {
  console.log(this.name.join(','))
}
var foo = new Sub()
```

这种方式即保证了实例拥有自己的属性，同时也实现了对函数的复用。

该方式的局限在于，会调用两次父类构造函数，由此在原型上产生同名属性的冗余。

![](https://user-gold-cdn.xitu.io/2019/8/22/16cb73f359d1443c?w=351&h=136&f=png&s=11240)

#### 原型式继承

借助原型已有的对象来创建一个新的对象。可以通过`Object.create`方法实现。

利用一个空的对象，将已有的对象直接复制给空对象构造函数的原型。

```js
function extend(obj) {
    function noop() {}
    noop.prototype = obj
    return new noop()
}

var Animals = {
    name: 'animal',
    type: ['dog', 'cat', 'bird']
}
var anotherAnimals = extend(Animals)
anothierAnimals.type.push('horse')

var yetAnotherAnimal = extend(Animals)
yetAnotherAnimal.type.push('whale')

console.log(Animals.type) // ['dog', 'cat', 'bird', 'horse', 'whale']
```

Object.create方法同上述extend作用。

缺点同原型继承。

#### 寄生式继承

在原型式继承的基础上，为空构造函数新增属性和方法，来增强该对象。

```js
function cusExtend(obj) {
    var clone = extend(obj)
    clone.foo = function() {
        console.log('foo')
    }
    return clone
}
var Animals = {
    name: 'animal',
    type: ['dog', 'cat', 'bird']
}
var instance = cusExtend(Animals)
instance.foo() // foo
```

缺点同原型继承，且构造函数无法实现函数的复用。

#### 寄生组合继承

通过借用构造函数继承方式继承属性，通过寄生式继承父类的原型后赋值给子类的原型来继承方法。

```js
function SuperType(name) {
    this.name = name
}
function SubType(name, age) {
    SuperType.call(this, name, age)
    this.age = age
}
SubType.prototype = Object.create(SuperType.prototype)
SubType.prototype.constructor = SubType

var foo = new SubType('Mike', 16)
```

该方式优势和组合继承相同，同时仅调用了一次父类构造函数，规避了组合继承中原型属性冗余的问题。是一个理想的继承方式。

#### ES6类继承

Class 通过关键字 extends 来实现继承。

```js
class SuperType {
    constructor(name) {
        this.name = name
    }
}

class SubType extends SuperType {
    constructor(name, age) {
        super(name)
        this.age = age
    }
}

var foo = new SubType()
```

内部实现和寄生组合继承一样。不同的地方在于：

+ 多出了一条继承链：`SubType.__proto__ => SuperType`用于继承父类的静态属性和方法。
+ 先创建父类实例对象 this，再用子类的构造函数去修改 this，添加属性。因此必须要先调用父类的super()方法。ES5的继承是先创建子类的实例对象，再将父类的方法添加到this上。

### constructor的重写

在某些情况下，如果我们需要显示地去调用构造函数，比如我们想要实例化一个新的对象，可以借助去访问已经存在的实例原型上的constructor来访问到。这时候如果没有正确地重写，则会无法找到，为undefined。

constructor其实没有什么用处，只是JavaScript语言设计的历史遗留物。由于constructor属性是可以变更的，所以未必真的指向对象的构造函数，只是一个提示。不过，从编程习惯上，我们应该尽量让对象的constructor指向其构造函数，以维持这个惯例。


## 跨域

### 背景

+ 同源策略限制（协议，端口和域名相同）
+ 同源策略限制：针对接口的请求、DOM 的查询、Cookie、LocalStorage 和 IndexDB 无法读取。
+ 无同源策略的影响
  + CSRF 攻击，钓鱼网站跨域发送请求获取了 Cookie 鉴权信息

### 方法

#### JSONP

script 标签没有同源策略限制，因此可以通过 script 标签 发起一个请求，前端把回调函数的名称（前后端可约定）放到请求的 query 参数里面。然后服务端返回这个回调函数的执行，并将需要响应的数据放到回调函数的参数里，前端的 script 标签请求到这个执行的回调函数后会立马执行，这样前端就可以随意定制自己的函数来自动处理返回数据了。

缺点：只能支持 Get 请求

#### CORS（跨域资源共享）

允许浏览器向跨源服务器发送请求，需要浏览器端和服务器端同时支持。一般浏览器都能够支持，因此服务端配合支持即可。

CORS 请求分简单与非简单请求。

简单请求同时满足请求方法为 HEAD、GET、POST 且 HTTP 头部信息不超出固定字段（若 ContentTtype 为 json 也不满足）。

如果服务端设置 Access-Control-Allow-Origin 为 * ，则不会带上 Cookie 信息。如果需要传递 Cookie 则需要指定 origin，且设置 credentials。

非简单请求中会首先发一次预检测（OPTIONS 方法），询问当前网页所在的域名是否在服务器的许可名单之中，以及可以使用哪些HTTP动词和头信息字段，返回码是 204，如通过才发出真正的请求返回 200.

预检查除了设置 origin，**还需要设置 Access-Control-Request-Method**（检查请求方式是否支持） 以及 Access-Control-Request-Headers（**指定浏览器CORS请求会额外发送的头信息字段**）。

```js
// koa 配置 cors
// 处理cors
app.use(cors({
  origin: function (ctx) {
    return 'http://localhost:9099'
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'DELETE'],
  allowHeaders: ['t', 'Content-Type']
}))
```

CORS与JSONP的使用目的相同，但是比JSONP更强大。JSONP 只支持`GET`请求，CORS支持所有类型的HTTP请求。JSONP的优势在于支持老式浏览器，以及可以向不支持CORS的网站请求数据。

#### 代理

Nginx 或 Express 起服务（webpack-dev-server）代理转发请求，代理将请求转发至真正的服务端地址，避免了跨域。

```shell
# nginx
server{
    # 监听9099端口
    listen 9099;
    # 域名是localhost
    server_name localhost;
    #凡是localhost:9099/api这个样子的，都转发到真正的服务端地址http://localhost:9871 
    location ^~ /api {
        proxy_pass http://localhost:9871;
    }    
}
```

```js
// webpack
proxyTable: {
  '/api': {
    target: `http://localhost:9000`,
    ws: true,
    changeOrigin: true,
    pathRewrite: {
      '^/api': '/api'
    }
  }
}
```

#### 不同页面跨域通信

+ postMessage

  通过 iframe postMessage 发送消息。接受方通过监听 message 事件捕获消息

+ document.domain 实现共享 cookie

  用于主域名相同，子域名不同的场景，例如 比如主域名是 `http://crossdomain.com:9099`，子域名是`http://child.crossdomain.com:9099`。此时会收到同源策略限制，只要设置相同的 `document.domain = crossdomain.com`即可

+ location.hash

  通过第三个页面来监听 hash 事件，通过 hash 来传值并且 js 用于通信

参考：[不要再问我跨域的问题了](https://segmentfault.com/a/1190000015597029)

## Event Loop

Event Loop 是 JS 的执行机制。在主线程运行 JS 代码时，调用了某些异步 API 会往任务队列中添加事件，执行栈代码执行完毕后，会读取任务队列的事件去执行对应的回调，回调中可能又会产生不同的任务往队列中添加事件，如此循环形成了事件循环。

JS 的任务分为**微任务**与**宏任务**。

+ 宏任务主要有 setTimeout、setInterval、settImmediate、UI 渲染等
+ 微任务主要有 nextTick、Promise.then 等，在 async 函数中，**await 之前的代码可以看做是同步的**，可以直接按顺序执行，而 await 后面跟着的的 promise 函数，可以被转化为`Promise.resolve(fn())`的形式，它也属于同步任务。**await 后面的代码，则可以看做是 then()方法的回调函数（即微任务）**。

浏览器环境和 Node 环境中实现的 Event Loop 也是不相同的（主要针对 Node 11 之前版本）。

浏览器端每个宏任务完成后就去执行微任务。

而在Node.js 中，事件循环分为 timer、poll、check等六个阶段。microtask 会在事件循环的各个阶段之间执行，也就是一个阶段执行完毕，就会去执行microtask队列的任务。即微任务的执行时机不同。

## 首屏优化

+ Vue-Router路由懒加载（利用Webpack的代码切割）
+ 使用CDN加速，将通用的库从vendor进行抽离
+ gzip
+ Vue 异步组件
+ SSR
+ 第三方库按需加载，例如 Element-UI
+ SW 缓存文件
+ 使用link标签的rel属性设置   prefetch（这段资源将会在未来某个导航或者功能要用到，但是本资源的下载顺序权重比较低，prefetch通常用于加速下一次导航）、preload（preload将会把资源得下载顺序权重提高，使得关键数据提前下载好，优化页面打开速度）

## 安全问题

### xss

注入恶意的客户端代码，例如 js，用户输入的数据存储到服务器，请求数据时，回传后执行。

防范：特殊自负进行编码

### CSRF



## 防抖与节流

防抖是在短时间内多次触发同一个函数，最后只执行一次，例如窗口大小变化，输入搜索时。

```js
function debounce(fn, delay) {
  let timer = null
  return () => {
    let args = arguments
    timer && clearTimeout(timer)
    
    timer = setTimout(() => {
      fn.apply(this, args)
    }, delay
  }
}
```

节流是在一段时间内，函数只执行一次，例如懒加载监听滚动条位置，按一定的频率来获取

```js
function throttle(fn, delay) {
  let timer = null
  return () => {
    const args = arguments
    if (!timer) {
      timer = setTimeout(() => {
        fn.apply(this, args)
        timer = null
      }, delay)
    }
  }
}
```



## 性能优化

### 网络传输

+ 浏览器缓存开启
+ 减少请求资源的体积
  + 代码压缩
  + 公共模块抽离、代码分割、路由懒加载、CDN、tree-shaking
  + Gzip
+ 减少请求资源的数量 
  + 图片资源小图使用 base64，减少网络请求
  + 图片格式使用 Webp 加快图片加载速度（体积小）

### 页面渲染

+ js 阻塞渲染
  + defer、async
+ preload、prefetch
+ 避免重绘和重排

## 遗留 

+ Vue 3 对比 Vue 2 详细整理 （好在哪里）
+ webpack 
+ 输入url 到页面渲染的过程
+ DOM 事件与事件流
+ Promise 原理 + 手写
+ 前端性能优化
+ 防抖与节流
+ 箭头函数与普通函数区别
+ http 部分内容整理 （完成）
+ ES6 新特性 （map 、set 等）


木牛流马

+ 涉及相关技术栈 ： Vue 全家桶、Canvas
+ 项目中的困难
  + 微编辑模块数据流向复杂：通过 Controller 实例 + Vuex 解决
  + 别的页面需要接入模块的部分功能：模块拆分，仅保留 Canvas 实例的基础能力，其余模块按类似插件的形式注入，通过组合基础能力来构建定制化目的
+ 项目优化
  + 组件抽离：ImageCard
  + 虚拟滚动
  + 命令式组件：预览大图组件，调整为 命令式 调用
+ 存在的问题，以及可能的解决思路
  + 项目架构不清晰
  + 多个业务组件存在很多相似地方，考虑是否可以统一
  + 定制化页面过多？

GPU 资源管理

+ 设计技术栈： Vue 全家桶

+ 困难点

  + 表单项组合

    + 背景：大部分页面有下拉、输入框等等的表单筛选项。大量的模板代码，其中重复的代码量很大。表单中耦合了大量的业务逻辑，在表单出现了联动的需求时，满屏的 v-if 配合了magic number，让后续的人很难去快速清晰地了解这份表单中的逻辑和关系。随着业务的不断迭代，代码再交接了很多人之后，每个人的风格不同，并且表单中出现了和业务耦合的关系，如果代码处理的不好，表单会变得越来越难维护。

    + 抽离表单组件 JSON-Form，基于 json 配置表单，期望把重点聚焦在配置项中，而不需要去关心模板代码。

    + 构建基础： 传入 model 与 config json，完成 type 到 表单组件的映射，通过动态组件渲染

      表单最后提交到后端就是一个特定的对象，多个 key value 的映射关系。期望的表单组件就是传入一个 model，表示所需要的数据对象结构，例如 userName 或者是 address 数据对象。另外就是 json 的配置，是一个数组，里面的每一项是一个包含配置信息的对象。type 表示使用的组件类型（input、select灯），key  对应的就是 model 里面的 key，和具体的数据对象对应起来。以 Element-ui 为例，根据配置的 type 的渲染对应的表单组件就需要先维护一份 type -> 组件标签的映射，例如 input -> el-input。使用了 Vue 当中的 **动态组件** 来渲染不同类型的组件。

      对于特殊组件而言，例如 select，需要传入 options 参数，需要进行封装，新增 props 字段传递所需要的字段，并且结合 v-bind: $attrs 进行属性的透传。

    + 拓展：根据业务需求也会由表单进行拓展，基础的能力就无法满足，需要结合 Vue 的能力来实现

      + 条件渲染：选项 A 选择了某个值的时候， B 就不渲染。增加一个 ifRender 字段来控制，由于 A 是会变化的，因此这个字段需要配置成一个函数，来返回一个 boolean，这个函数的参数就是需要用到数据对象 model，并且将配置项处理结果放入到 computed 中，这样就让这个计算属性去依赖 model 的变化来更新。
      + 异步取值：有些下拉框的选项是依赖接口返回的数据，这时候 props 字段也不能够写成一个对象，在执行 data 函数的时候，此时还没有把 data 上的属性挂载到 实例（this）上，所以会是 undefined。因此也需要写成函数的形式，返回对象。这样在 computed 阶段去执行这个函数的时候，这时候 data 已经挂载添加到实例（this）上，并且同时会触发这个字段的 getter，因此从接口获取到数据之后，表单项中能够渲染出来。
      + 方法透传：组件本身自带很多 API，change 事件等等，所以还需要新增一个字段 on，以对象的形式来存储需要用到的方法，用 v-on：$listener 进行透传，这个地方就不需要写成函数了，因为 data 的初始化是在 method 之后，所以直接写成对象的形式即可。
      + 自定义组件的渲染：有些表单中会包含非常规表单项，可能是一个列表，可以增加或删除表格行，然后每一个行里面有若干个输入框。前面从 type 映射到对应的表单组件并能够渲染出来是因为我们在引入组件库的时候，是将其注册为全局组件。这种针对某个页面的特定组件没必要放在全局组件中，因此需要增加自定义组件的渲染，不用 动态组件，而直接使用 render 函数。增加一个 render 字段，里面是一段 JSX，在 render 函数内部判断是否有 render 字段，来进行对应的渲染。















