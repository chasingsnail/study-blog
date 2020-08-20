# 模块化定义

将一个复杂的程序依据一定的规则(规范)封装成几个块(文件), 并进行组合在一起；块的内部数据/实现是私有的, 只是向外部暴露一些接口(方法)与外部其它模块通信

# 模块化的优点

- 更好地分离：避免一个页面中放置多个script标签，而只需加载一个需要的整体模块即可，这样对于HTML和JavaScript分离很有好处；
- 更好的可维护性
- 按需加载：提高使用性能，和下载速度，按需求加载需要的模块
- 避免命名冲突：JavaScript本身是没有命名空间，经常会有命名冲突，模块化就能使模块内的任何形式的命名都不会再和其他模块有冲突。
- 更好的依赖处理：使用模块化，只需要在模块内部申明好依赖的就行，增加删除都直接修改模块即可，在调用的时候也不用管该模块依赖了哪些其他模块。

# 模块化演进

+ 全局function 

```js
function fun1 () {}
function fun2 () {}
```

将不同功能封装为不同的函数。

污染全局变量，容易引起命名冲突，无法体现模块成员间的关系。

+ 对象封装

```js
const customModule = {
  data: '123',
  func1() {},
  func2() {}
}
```

暴露模块所有成员，内部状态可以被改写。

+ IIFE

```js
(function(window) {
  let data = '123'
  
  function func1() {}
  
  function fun2 () {}
  
  window.myModule = {
    func1,
    fun2
  }
})(window)
```

可实现数据的私有化，外部只能通过暴露的方法来进行操作。

无法依赖另一个模块。

+ IIFE增强

```js
(function ($) {
  $('body').css('color', 'red')
})(jquery)
```

现代模块化基石。保证了模块的独立性，且强调了模块之间的依赖关系。

# CommonJS

Node 应用由模块组成，采用 CommonJS 模块规范。**CommonJS规范加载模块是同步的**，也就是说，只有加载完成，才能执行后面的操作。由于Node.js主要用于服务器编程，**模块文件一般都已经存在于本地硬盘，所以加载起来比较快，不用考虑非同步加载的方式，所以CommonJS规范比较适用**。

Node 环境中在解析 js 文件时，注入 require，module.exports ，而其他环境不一定能够提供。

## 基本用法

- 暴露模块：`module.exports = value`或`exports.xxx = value`
- 引入模块：`require(xxx)`,如果是第三方模块，xxx为模块名；如果是自定义模块，xxx为模块文件路径

## 特点

- 所有代码都运行在模块作用域，不会污染全局作用域。
- (单例) 模块可以多次加载，但是**只会在第一次加载时运行一次**，然后运行结果就被**缓存**（内存对象）了，以后再加载，就直接读取缓存结果。要想让模块再次运行，必须清除缓存（webpack 热更新场景）。
- 模块加载的顺序，按照其在代码中出现的顺序。

```js
var x = 5;
var addX = function (value) {
  return value + x;
};
module.exports.x = x;
module.exports.addX = addX;
```

## 加载机制

CommonJS模块的加载机制是，输入的是被输出的值的**拷贝**。也就是说，一旦输出一个值，模块内部的变化就影响不到这个值。这一点与 ES Module 不同。

```js
// lib.js
var counter = 3;
function incCounter() {
  counter++;
}
module.exports = {
  counter: counter,
  incCounter: incCounter,
};

// main.js
var counter = require('./lib').counter;
var incCounter = require('./lib').incCounter;

console.log(counter);  // 3
incCounter();
console.log(counter); // 3
```

## exports 和 module.exports  

当在 node 环境中执行一个文件时，会在文件内部生产一个 exports 和 module 对象。二者的关系如下：

```js
exports = module.exports = {}
```

二者都指向同一块内存区域。exports 是 module.exports 的引用。

而 require 导出的内容是 module.exports 的指向的内存块内容，并不是 exports 的。 

# AMD

AMD规范则是**非同步加载模块**，允许指定回调函数。**如果是浏览器环境，要从服务器端加载模块，这时就必须采用非同步模式（否则会阻塞网页加载），因此浏览器端一般采用AMD规范**。

## 基本用法

```js
// 定义没有依赖的模块
define(function(){
   return 模块
})

// 定义有依赖的模块
define(['module1', 'module2'], function(m1, m2){
   return 模块
})

// 引入使用模块
require(['module1', 'module2'], function(m1, m2){
   // 使用m1/m2
})
```

## 特点

每个模块也都是单例的。多次引用同样是读取缓存。

未使用 AMD 的情况下，浏览器会发送多个请求，并且引入的 JS 文件顺序不能搞错。

使用 AMD 需要引入 require.js 。

# UMD

作为一种同构方案，UMD 同时兼容 CommonJS 与 AMD 两种规范。

```js
;(function (self, factory) {
	if (typeof module === 'object' && typeof module.exports === 'object') {
		// CommonJS 规范环境
		module.exports = factory()
	} else if (typeof define === 'function' && define.amd) {
		// AMD 规范环境
		define(factory)
	} else {
		// 什么环境都不是，直接挂在全局对象上
		self.umdModule = factory()
	}
})(this, function () {
	return function () {
		return Math.random()
	}
})
```

常用在第三方依赖库打包文件中，例如 Vue.js

# ES Module

ES6 模块的设计思想是尽量的**静态化**，使得编译时就能确定模块的依赖关系，以及输入和输出的变量。CommonJS 和 AMD 模块，都只能在运行时确定这些东西。比如，CommonJS 模块就是对象，输入时必须查找对象属性。

该规范是由 **JS 解释器**实现的，而 CommonJS 和 AMD 主要依赖于宿主环境中运行时实现的。

## 基本用法

```js
// export-default.js
export default function () {
  console.log('foo');
}

// 定义模块 math.js
var basicNum = 0;
var add = function (a, b) {
    return a + b;
};
export { basicNum, add };

// 引用模块
import { basicNum, add } from './math';
function test(ele) {
    ele.textContent = add(99 + basicNum);
}

// 导入语句重命名
import { moduleA as Module } from './moudleA'
```

## 运行机制

+ CommonJS 模块输出一个值的拷贝，而ES Module输出的是**值的引用**
+ CommonJS 是运行时加载，ES Module 是编译时输出接口（CommonJS 本质上加载的是一个module.export对象，因此只有在运行时才会生产，而后者不是对象，是一种在代码解析阶段生成的静态定义）

```js
// lib.js
export let counter = 3;
export function incCounter() {
  counter++;
}
// main.js
import { counter, incCounter } from './lib';
console.log(counter); // 3
incCounter();
console.log(counter); // 4
```

由于 ESM 静态分析的特点，因此不能够给导入路径设置一个变量，或是利用条件判断导入模块，在静态分析阶段无法做出这样的识别。特殊的情况是动态引入 import() 方法中的参数可以是一个变量，其是异步加载。

而 CommonJS 是运行时加载，因此没有限制。

# 后模块化

随着不同环境中 js 解释器的升级最终会支持 es module，但是由于用户可能是用旧版浏览器的原因，需要使用工具将代码进行向低版本兼容。例如 babel。

babel 会将 ES Module 编译为 CommonJS 语法。因此还需要借助打包工具，如 webpack / rollup

+ 打包工具 webpack 能够处理 js 不同版本间**模块化**的区别
+ 编译工具 babel 主要是处理 js 版本间**语义**的问题

使用 ES Module 必须配合 webpack 和 babel（语法转换）

AMD 与 CommonJS 至少使用 webpack 即可



nodejs 是一个运行时的规范，需要用到运行时的模块进行解析。

nodejs 中有一个模块是 vm，连接上层js代码和底层的v8引擎，能将字符串解析成可执行的代码，对比 js new Function、eval。

```js
const vm = require('vm')

const script = new vm.Script('console.log("hello world")')

script.runInThisContext() // hello world
```

调用了底层解析能力，在当前运行上下文环境运行了这段代码。

nodejs 也是用了这样的形式，通过读取模块，把js模块转换成了一段一段符合 commonjs 规范的代码。

例子：尝试导出 module.exports = 'hello' 模块

首先通过 fs 读取模块的内容