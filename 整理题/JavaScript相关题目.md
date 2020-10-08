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

## 作用域与闭包

### 函数生命周期

函数声明会被提前，然后再执行业务代码。当函数执行完成推出后，释放该函数的上下文环境并注销该函数的局部变量。如果变量名和函数声明相同是，函数优先声明。

### AO与VO

VO（变量对象）对应函数创建阶段，在解析时，所有的变量和函数声明统称为VO。

AO（活动对象）对应函数执行阶段，当函数被调用时，会创建一个执行上下文。该执行上下文包含了所有函数需要的变量，这些变量共同组成了一个新的对象就是AO（函数的所有局部变量、参数、this等）。

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

能够访问另一个函数作用域中变量的函数。在闭包内部可以访问外部环境的变量对象。闭包只存储外部变量的引用（经典for循环问题，打印出最后一个i）。在函数调用完成后，其执行上下文环境不会被销毁。

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

+ document.domain

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