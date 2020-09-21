this作为JavaScript中的一个关键字，拥有较为复杂的机制。this的一个重要的前提是，总是指向调用它所在方法的对象，而与声明的位置无关。即this对象是在运行时基于函数的执行环境绑定的。

## this的四种绑定场景
### 默认绑定
默认绑定通常是作为纯粹的独立函数调用。在非严格模式下，this指向全局对象；严格模式下，this指向undefined，此时会抛出错误。
```js
function foo() {
    console.log(this.a)
}
var a = 'global'
foo() // 'global'

function bar() {
    'use strict'
    console.log(this.a)
}
bar() // TypeError:a undefined
```
《你不知道的JS》书中还提到一种特别的情况：在严格模式下调用其他函数，不会影响其默认绑定：
```js
function foo() {
    console.log(this.a)
}
var a = 'global'
function bar() {
    'use strict'
    foo() // 此时不影响其默认绑定
}
bar() // global  此时仍然指向全局
```
但是在一般情况下，代码中不会出现严格模式与非严格模式混用的情况。
### 隐式绑定
隐式绑定是作为对象方法的调用。在调用的位置，检查是否有上下文对象，若有，则将其隐式绑定在这个对象上。
```js
function foo() {
    console.log(this.a)
}
var a = 'global'
var bar1 = {
    a: 1,
    foo: foo
}
var obj2 = {
    a: 2,
    obj1: bar1
}
bar1.foo() // 1 this指向调用函数的对象，即bar1
obj2.obj1.foo() // 1 this指向最后一层调用函数的对象
```
隐式绑定会还会出现this丢失的问题：
```js
// 接上
let baz = bar1.foo
barz() // 'global' baz仅是bar1.foo的一个引用，所有此时this指向全局对象
```
在调用时，没有上下文对象，此处仅仅是对于函数的引用，由此导致了丢失问题。

**(重要)**还有一种丢失情况更为隐蔽：在传入回调函数中。

```js
function Foo(fn) {
    this.a = 1
    fn()
}
var obj = {
    a: 2,
    foo() {
        console.log(this.a)
    }
}
 Foo(obj.foo) // 1 此情况是传入了函数的引用
```
### 显示绑定
显示绑定是通过call、apply等方法，将函数中的this绑定到指定对象上。
```js
function foo() {
    console.log(this.a)
}
var bar = {
    a: 2
}
var a = 'global'
foo.call(bar) // 2
```
如果将原始值作为call、apply、bind方法的第一个参数，则会将其转换为它的对象形式。

如果将null或undefined传入，则在调用时会被忽略，从而this指向全局对象。
### new绑定
new绑定是作为构造函数调用。在new的时候，会发生以下过程：
1. 创建一个新的对象
2. 将构造函数的作用域赋值给这个新的对象（this指向该对象）
3. 执行构造函数中的代码
4. 若函数没有返回对象(Object)，否则（return 基本类型、无 `return` 或 `return this`）会返回该新对象
```js
function Foo(a) {
    this.a = a
}
let bar = new Foo(1)
console.log(bar.a) // 2
```
```js
var slice = Array.prototype.slice
// 模拟 new 关键字
function createNew (constructor, ...arg) {
  let o = new Object()
  o.__ptoto__ = constructor.prototype
  // Foo.call(this)
  constructor.apply(o, arg)
  return o
}

function Foo(name) {
  this.foo = name
}

var foo = createNew(Foo, 'hello')
```



## 改变this的指向

能够改变this指向的方法除了上述提到的使用apply方法和通过new实例化对象之外。还有存在几种情况。
### setTimeout
setTimeout的回调函数中，this使用的是默认绑定，即指向全局对象。
```js
function foo() {
    console.log(this.a)
}
var a = 'global'
var bar = {
    a: 'bar',
    b: function() {
        setTimeout(function() {
            console.log(this.a)
        }, 10)
    }
}
var baz = {
    a: 'baz',
    b: foo
}
bar.b() // global
setTimeout(function() {
    baz.b()
}, 10) // baz 此时仍然为隐式绑定
```
### 箭头函数
箭头函数中，this继承于它外面第一个非箭头函数的函数的this指向；一旦绑定了上下文，则不会被改变，即不可以使用call、apply这些方法再改变this指向。
```js
function foo() {
    return ()=> {
        console.log(this.a)
    }
}
var bar1 = {
    a: 1
}
var bar2 = {
    a: 2
}
let baz = foo.call(bar1) // 此时this指向bar1
baz.call(bar2) // 1 注意此时this指向在绑定bar1后，不会改变
```
结合setTimeout：
```js
function foo() {
    console.log(this.a)
}
var a = 'global'
var bar = {
    a: 'bar',
    b: function() {
        setTimeout(()=> { // 箭头函数使得此时 this 不指向全局
            console.log(this.a)
        }, 10)
    }
}
bar.b() // bar 指向bar对象
```
稍微复杂一些的例子：
```js
var obj = {
    foo: function() {
        return () => {
            console.log(this)
        }
    },
    bar: function(){
        return function() {
            return ()=>{
                console.log(this);
            }
        }
    },
    baz: () => {
        console.log(this)
    }
}
let foo = obj.foo()
foo() // 指向obj，此时为隐式绑定
let bar = obj.bar()
let bar1 = bar() // 实际上为隐式丢失情况，即执行默认绑定
bar1() // 指向window 
obj.baz() // 指向window 执行为箭头函数，obj中不存在this，箭头函数按词法作用域往上查找到全局的this
```
## 一道经典的题目
```js
var number = 5;
var obj = {
    number: 3,
    fn1: (function () {
        var number;
        this.number *= 2;
        number = number * 2;
        number = 3;
        return function () {
            var num = this.number;
            this.number *= 2;
            console.log(num);
            number *= 3;
            console.log(number);
        }
    })()
}
var fn1 = obj.fn1;
fn1.call(null);
obj.fn1();
console.log(window.number);
```
在`var fn1 = obj.fn1`定义的时候，fn1对应的闭包已经执行，此时应用的是默认绑定（注意此时非隐式绑定）。

再执行`fn1.call(null)`，首先`num`的值为`this.number(window.number)`，在闭包中已经执行`this.number *= 2`，所以此时`num`为10;`number`初始赋值为3，经过`number *= 3`后，打印为9

接着执行`obj.fn1()`，此时应用隐式绑定，this指向obj。此时不执行闭包中代码，对于`num`，此时`this.number`为3；由于前面的步骤执行了闭包，所以`number`值得以保留为9，因此当执行`number *= 3`时，最后打印出来的`number`值为27。

最后`window.number`的数值由于在`num`赋值后再执行了`this.number *= 2`，所以输出为20。

因此最后的结果整理可得:
```js
10
9
3
27
20
```

那么如果将fn1改为普通函数呢？
```js
var number = 5;
var obj = {
    number: 3,
    fn1: function () {
        var number;
        this.number *= 2;
        number = number * 2;
        number = 3;
        return function () {
            var num = this.number;
            this.number *= 2;
            console.log(num);
            number *= 3;
            console.log(number);
        }
    }
}
var fn1 = obj.fn1();
fn1.call(null);
obj.fn1()();
console.log(window.number);
```
`fn1`保留为fn1返回函数的引用，`fn1.call(null)`应用默认绑定规则，this.number指向全局，所以打印为5，number同样为9。

`obj.fn1()()`中this指向为全局，注意此处非隐式绑定，可以看作是
```js
var foo = obj.fn1()
foo()
```
后续执行第一步相同，此时的this.number经过第一步后，变为10，所以num打印为10，number与第一步判断相同，打印9。

window.number在第二步中执行过`this.number *= 2`之后，打印为20。
因此最后的结果整理可得:

```
5
9
10
9
20
```
## 扩展
### call、apply、bind对比理解
首先，call和apply的共同点在于，都能够改变函数执行时的上下文，将一个对象的方法交由给另一个对象来执行。他们之间的主要区别在于传参。
#### call
```js
fun.call(thisArg, arg1, arg2, ...)
```
thisArg为fun函数执行时指定的this值，arg1, arg2, ... 为指定的参数。

引用MDN上的一个例子：
```js
function list() {
  return Array.prototype.slice.call(arguments);
}
var list1 = list(1, 2, 3); // [1, 2, 3]
```
调用了call方法后，this指向**arguments**，上述例子中，我们将一个类数组对象（arguments）转换成了一个真正的数组。

假设我们现在模拟call方法，尝试写一个myCall方法，则myCall内部的实现过程主要是：
1. 设置上下文对象，即this的指向
2. 将this隐式绑定到传入的context上
3. 传入参数，执行该方法

具体实现如下：
```js
Function.prototype.myCall = function(context, ...arg) {
    if (context === null || context === undefined) {
    // context为null、空、undefined时，指向window
      context = window
    } else {
      context = Object(context) // 考虑传入原始值情况，将其隐式转换为对象
    }
    const tempProto = Symbol.for('temp') // 使用Symbol保证了不会覆盖context原有属性，且保持了唯一性
    context[tempProto] = this // 将this绑定到context上，this可看做是函数本身
    let result = context[tempProto](...arg) // 传参
    delete context[tempProto] // 删除上下文对象属性
    return result
 }
```
#### apply
apply的用法区别于call方法，其第二个参数必须是数组或类数组。
```js
// 获取数组中最大项
var arr = [1, 2, 3]
Math.max.apply(null, arr) // 3
```
模拟apply方法与myCall方法类似，只是在处理传参的部分有些不同。因此在针对第二个参数的判断上，我们要先确定该参数是否为类数组。
```js
// apply
Function.prototype.myApply = function (context) {
    if (context === null || context === undefined) {
        context = window
    } else {
        context = Object(context)
    }
    // 类数组判断
    function isArrayLike(o) {
        if (o &&                                    // o不是null、undefined等
           typeof o === 'object' &&                // o是对象
           isFinite(o.length) &&                   // o.length是有限数值
           o.length >= 0 &&                        // o.length为非负值
           o.length === Math.floor(o.length) &&    // o.length是整数
           o.length < 4294967296)                  // o.length < 2^32
           return true
        else
           return false
    }
    const tempProto = Symbol.for('temp')
    context[tempProto] = this
    let args = arguments[1]
    let result
    // 针对第二个参数判断
    const isArray = Array.isArray(args) || isArrayLike(args)
    if (args) {
        if (!isArray) {
            throw new TypeError('error')
        } else {
            args = Array.from(args)
            result = context[tempProto](...args)
        }
    } else {
        result = context[tempProto]()
    }
    delete context[tempProto]
    return result
}
```
#### bind
> bind()方法创建一个新的函数，在bind()被调用时，这个新函数的this被bind的第一个参数指定，其余的参数将作为新函数的参数供调用时使用。  
> --MDN

```
fun.bind(thisArg[, arg1[, arg2[, ...]]]);
```
其中，thisArg为调用函数时作为this参数传递给目标函数的值。如果使用new运算符构造绑定函数，则会忽略该值。bind方法返回一个原函数的拷贝，并拥有指定的this值和初始参数。

bind可以使得函数拥有一个预设的初始参数，如_add方法所示。

```js
function add(arg1, arg2) {
    return arg1 + arg2
}
var res1 = add.bind(null, 1, 2)() // 3
var _add = add.bind(null, 1)
var res2 = _add(2) // 1 + 2 = 3
var res3 = _add(2, 3) // 1 + 2 = 3,忽略第二个参数
```
接着再来看使用new去调用bind之后的函数：
```js
function Animal (name, type) {
    this.name = name
    this.type = type
}
var obj = {
    age: 1
}
var bindAnimal = Animal.bind(obj, 'lucky')
var dog = new bindAnimal('dog')
console.log(dog) // Animal {name: 'lucky', type: 'dog'}
console.log(obj) // {age: 1}
```
此时我们可以看出，`bindAnimal`内部的this不在是obj。而当我们使用普通函数去调用时：
```js
// 接上
bindAnimal('cat')
console.log(obj) // {age: 1, name: "lucky", type: "cat"}
```
这时候我们可以看出，this的指向符合预期地指向了obj。同时MDN中提到，作为构造函数使用的绑定函数并不是最佳的解决方案，且可能不应该用在任何生产环境中。

手动实现bind方法可参考MDN中polyfill实现：
```js
Function.prototype.bind = function(oThis) {
    if (typeof this !== 'function') {
      // closest thing possible to the ECMAScript 5
      // internal IsCallable function
      throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
    }

    var aArgs   = Array.prototype.slice.call(arguments, 1),
        fToBind = this,
        fNOP    = function() {},
        fBound  = function() {
          // this instanceof fBound === true时,说明返回的fBound被当做new的构造函数调用
          return fToBind.apply(this instanceof fBound
                 ? this
                 : oThis,
                 // 获取调用时(fBound)的传参.bind 返回的函数入参往往是这么传递的
                 aArgs.concat(Array.prototype.slice.call(arguments)));
        };

    // 维护原型关系，如果有原型的情况下,使用原型式继承
    if (this.prototype) {
      // Function.prototype doesn't have a prototype property
      fNOP.prototype = this.prototype; 
    }
    // 下行的代码使fBound.prototype是fNOP的实例,因此
    // 返回的fBound若作为new的构造函数,new生成的新对象作为this传入fBound,新对象的__proto__就是fNOP的实例
    fBound.prototype = new fNOP();

    return fBound;
 };
```
其中维护原型关系可以理解为继承操作，如果不去维护原型，则实例无法继承绑定函数的**原型**中的对象。
```js
function Point(x, y) {
  this.x = x;
  this.y = y;
}

Point.prototype.toText = function() { 
  return this.x + ',' + this.y; 
};

var emptyObj = {};
var YAxisPoint = Point.bind2(emptyObj, 0);
var a = new YAxisPoint(5)
```
此时我们在控制台打印`a`实例，可以发现实例`a._proto_`中没有`toText`方法。

这里如果我们直接将绑定函数的`prototype`赋给`fBound.prototype`：
```js
// ...
fBound.prototype = this.prototype
return fBound
```
这种情况如果我们通过修改`fBound.prototype`可以直接修改`this.prototype`。所以polyfill中使用了借由`fNOP`为中介的方式，把`fBound.prototype`赋值给`fNOP`的实例。当然，我们还可以借由`Object.create()`实现：
```js
// ...
fBound.prototype = Object.create(fToBind.prototype)

return fBound
```
此方法中未能实现`oThis`传入原始值的情况，如需要，则需要同上文call的实现中，执行`Object()`来包装对象。

#### 应用

compose函数，接受一组函数，从右向左执行，前一个函数的返回值是下一个函数的入参。

```js
const getText = name => `HELLO ${name}`
const toUpper = str => str.toUpperCase()
const fn = compose(toUpper, getText)
fn('world') // 'hello world'
```

函数内部可通过call实现，类似webpack中某种文件类型需要使用多个loader来处理的方式。

```js
const compose = function(...arg) {
  let len = arg.length
  let count = len - 1
  let result // 执行结果
  return function(...innerArg) {
    result = arg[count].call(this, innerArg)
    if (count > 0) {
      count--
      return arg[count].call(null, result)
    } else {
      return result
    }
  }
}
```

### this原理
我们先来看一个例子
```js
var a = 'global'
var obj = {
    a: 'obj',
    foo() {
        console.log(this.a)
    }
}
obj.foo() // 'obj'
var foo = obj.foo
foo() // 'global'
```
上述代码中`obj.foo`和`foo`指向同一个函数，但执行结果不同。对于前者而言，其运行在`obj`环境，自然指向`obj`；而后者运行在全局环境，所以this指向全局。

我们都知道引用类型的值是保存在内存中的对象。因此当我们将一个对象赋值给obj，实际上是在内存中生成一个对象，然后将该对象的内存地址赋值给obj。

上述例子中，`obj.a`属性的值保存在属性描述对象的value属性中，二对于`obj.foo`而言，是将函数的地址赋值给foo属性的value属性。

由于函数是一个单独的值，所以它可以在不同的环境（上下文）中执行。详情可参考[JavaScript的this原理](http://www.ruanyifeng.com/blog/2018/06/javascript-this.html)。