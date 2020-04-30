## 任务划分

### 宏任务（macro-task）

script 代码、setTimeout、setInterval、setImmediate、I/O、UI rendering

### 微任务

Promise.then()、process.nextTick、MutationObserver 等。

### 执行顺序

整段代码作为宏任务进入主线程。在执行中会判断时同步任务还是异步任务。异步任务会被推入各自的（宏任务、微任务）队列中。当主线任务全部执行完毕后，会去检查微任务队列是否为空，不为空则将微任务队列全部执行完毕。如果为空，则去读区宏任务队列中最前面的任务，在执行中又会遇到不同的任务，以此类推，直到两个队列都被清空。

**（针对Node 11 之前的版本，11版本往后则与浏览器端一致）浏览器端每个宏任务完成后就去执行微任务。而在Node.js中，microtask会在事件循环的各个阶段之间执行，也就是一个阶段执行完毕，才会去执行microtask队列的任务。即微任务的执行时机不同。**

```js
console.log('start')
setTimeout(() => {
  console.log('timer1')
  Promise.resolve().then(function() {
    console.log('promise1')
  })
}, 0)
setTimeout(() => {
  console.log('timer2')
  Promise.resolve().then(function() {
    console.log('promise2')
  })
}, 0)
Promise.resolve().then(function() {
  console.log('promise3')
})
console.log('end')

// 浏览器端执行setTimeout之后会执行微任务，打印为 timer1 -> promise1 -> timer2 -> promise2
// Node端会在timer阶段执行完所有的setTimeout和setInterval，即打印为 timer1 -> timer2 -> promise1 -> promise2
```

#### Promise

当遇到 new Promise 时，会立即执行，而 then 的回调函数则会被推入微任务队列。

#### async/await

当遇到async/await时，await 之后跟着的函数可以被转化为`Promise.resolve(fn())`的形式，它属于**同步任务**。而await之后的代码，则视作 then 方法的回调，即**微任务**。

```js
async function async1() {
  console.log('async1 start') // 3 同步
  await async2() // 同步
  console.log('async1 end') // 7 微任务
}
async function async2() {
  console.log('async2') // 4
}
console.log('script start') // 1
new Promise(function(resolve) {
  console.log('promise start') // 2
  resolve()
}).then(function() {
  console.log('then1') // 6
}).then(function() {
  console.log('then2') // 8
})
setTimeout(function() {
  console.log('setTimeout') // 9
}, 0)
async1()
console.log('end') // 5

// script start -> promise start -> async1 start => async2 -> end -> then1 -> async1 end -> then2 -> setTimeout
```

还有一种情况是，await后面跟着的是一个异步函数的调用，则不会先将await之后的代码推入微任务队列，而是先跳出async函数执行后面的代码。执行完毕后再回到async函数中去执行剩下的代码，这时候才会将await后面的代码注册到微任务队列中去。

```js
console.log('script start')

async function async1() {
    await async2()
    console.log('async1 end')
}
async function async2() {
    console.log('async2 end')
    return Promise.resolve().then(()=>{
        console.log('async2 end1')
    })
}
async1()

setTimeout(function() {
    console.log('setTimeout')
}, 0)

new Promise(resolve => {
    console.log('Promise')
    resolve()
})
.then(function() {
    console.log('promise1')
})
.then(function() {
    console.log('promise2')
})

console.log('script end')
// script start => async2 end => Promise => script end => async2 end1 => promise1 => promise2 => async1 end => setTimeout
```

#### proccess.nextTick

一个独立于 Event Loop 的任务队列，Node 11 之前，在每个事件循环结束后，会先去检查 nextTick 队列，优先于微任务执行。Node 11 之后，其作为微任务的一种存在。

```js
setTimeout(() => {
 console.log('timer1')
 Promise.resolve().then(function() {
   console.log('promise1')
 })
}, 0)
process.nextTick(() => {
 console.log('nextTick')
 process.nextTick(() => {
   console.log('nextTick')
   process.nextTick(() => {
     console.log('nextTick')
     process.nextTick(() => {
       console.log('nextTick')
     })
   })
 })
})
// nextTick => nextTick => nextTick => nextTick => timer1 => promise1
```



#### Node中的六个阶段

timers 阶段：这个阶段执行timer（setTimeout、setInterval）的回调

I/O callbacks 阶段：处理一些上一轮循环中的少数未执行的 I/O 回调

idle, prepare 阶段：仅node内部使用

poll 阶段：获取新的I/O事件, 适当的条件下node将阻塞在这里（等待timer到达下限时间）

check 阶段：执行 setImmediate() 的回调

close callbacks 阶段：执行 socket 的 close 事件回调

#### setTimeout 与 setImmediate

`setImmediate()`具有最高优先级，只要`poll`队列为空，代码被`setImmediate()`，无论是否有`timers`达到下限时间，`setImmediate()`的代码都先执行。

- setImmediate 设计在poll阶段完成时执行，即check阶段；
- setTimeout 设计在poll阶段为空闲时，且设定时间到达后执行，但它在timer阶段执行

如果二者在主模块中调用，则执行先后顺序取决于进程性能，即随机顺序。如果进入timers阶段，已达到setTimeout下限时间，则会先执行setTimeout。否则会来到poll阶段，此时队列为空，并且有`setTimemout`的回调函数，进入check阶段执行回调。

如果二者在异步i/o callback内部被调用时，则setImmediate先执行。因为代码在IO回调，是在poll阶段去执行，这时发现队列为空，此时有代码被setImmedate()，所以直接进入check阶段执行响应回调。




## 参考

[最后一次搞懂 Event Loop](https://juejin.im/post/5cbc0a9cf265da03b11f3505)

[浏览器与Node的事件循环(Event Loop)有何区别?](https://juejin.im/post/5c337ae06fb9a049bc4cd218)

