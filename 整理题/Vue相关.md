## 原理层

### 生命周期的理解（各阶段做了什么，在什么时机触发）

#### 有哪些生命周期

#### 父子组件生命周期执行顺序（结合源码实现）

### 双向绑定的实现

响应式是机遇 Object.defineProperty 深度遍历对数据对象进行劫持的。每个组件都有自己的渲染 watcher 实例，在 组件 patch 的过程中，会触发数据对象属性的 getter，从而收集到相应的 watcher。在对于数据对象属性进行修改的时候，会触发对应的 setter，从而通知 watcher ，会将其放置到一个缓存队列中，通过 next-tick 在下一个循环中遍历更新对应的组件渲染。

### 对数组的特殊处理

### next-tick的实现

#### 作用

在下次 DOM 更新循环结束后执行延迟回调，在修改数据之后立即使用 `nextTick` 来获取更新后的 DOM。

#### 实现

优先使用 microTask，往后逐渐降级为 macro task 的 setTimeout：

1. promise.then
2. MutationObserver (监听 DOM 树的更改)
3. setImmediate
4. setTimeout

原因在于，往往两个 macro task 之间会穿插 UI 渲染（例如 v-on 绑定的事件回调回强制走 macro task）。结合 JS 执行任务队列机制，调用栈空闲后会执行先清空 micro task 队列，然后才会执行下一个 macro task。因此可以优先在 micro task 中把 UI 渲染之前需要更新的数据全部更新，这样只需一次渲染就能得到最新的 DOM。

#### 应用

1. 获取数据更新之后的 DOM

2. Vue 使用异步队列更新，这样做时为了避免修改多个属性值时，每一个属性的更改都触发重新渲染的问题。通过将 watcher 放进一个队列中，同时判断不会重复添加，当所有的变化完成时，一次性更新队列中所有 watcher 的更新。

### computed 与 watch 的实现与对比

#### computed

computed 依赖其他属性的计算值，并且有缓存。只有当其依赖的值发生变化时才会更新。

在初始化阶段，先会初始化对应的 computed watcher 实例，接着通过 Object.defineProperty 对数据对象进行代理，添加 getter 和 setter。computed watcher 在初始化构造函数中不做任何操作。

当在渲染 patch 中，触发了 computed 属性的 getter，首先会对其进行求值，求值的过程中会触发其依赖的所有响应式数据的 getter，因此所有依赖数据的 dep 订阅了 computed watcher（同时 computed watcher 的 deps 收集到了依赖数据的 dep），并且每个依赖数据的 dep 收集到渲染 watcher（watcher.depend -> this.deps[i].depend）。

当依赖数据改变时，触发其 dep 中收集到的 watcher 的更新，此时 watcher 中含有 computed watcher 与 渲染 watcher。当在触发渲染 watcher 更新的过程中，又会触发这些响应式的数据的 getter，在对应的计算属性值的 getter 中会去获取其最新的值渲染到页面上。

相对比于旧版 Vue 的实现，新版让依赖数据的 dep 持有 computed watcher 与 渲染 watcher，在调用 computed watcher 时，会将 this.dirty 置为 true（为了后续调用 evaluate 方法），调用渲染 watcher 时，获取 computed 最新的值。旧版实现为，在computed watcher 实例内部初始化了一个 dep，并收集了渲染 watcher。当依赖数据对象改变时，触发了 computed watcher 的更新，此时获取到该计算属性的最新值与旧值做对比，如果不同则会调用实例中 dep 持有的渲染 watcher 更新，由此触发了页面的重新渲染。

区别在于渲染 watcher 订阅了谁的变化，新版中为依赖数据的 dep，（依赖最终 patch 过程中判断是否新旧值相同？？）。旧版为 comptued watcher 实例自身的 dep，直接判断新旧值是否相同来决定是否触发渲染 watcher 更新。

#### watch

侦听属性 watcher 也是根据用户的定义，通过生成 watcher 实例来实现的。本质上也是一个 watcher。同样地，在构造函数内初始化阶段（option.user = true）会调用 this.get() 方法，获取到该 watcher 对应的数据对象值，这时候会触发数据对象的 getter，收集到侦听属性的 watcher，如果侦听的值是一个对象并且配置了 deep 属性为true，则会深度遍历对应的数据对象，在遍历的时候会触发对象子属性的 getter，这样就可以对象下的每个子属性都会收集到这个 watcher。如果不开启 deep，则只能够触发对象最外层属性的 getter，对其子属性的更改则不会触发更新。

+ sync 配置

在实例化 watcher 的过程中，可以配置 option.sync 为 true，这样定义了同步执行的观察者。当数据发生变化时，该观察者将以同步的方式执行。

```js
update() {
  /* istanbul ignore else */
  if (this.computed) {
   // ...
  } else if (this.sync) {
    this.run()
  } else {
    queueWatcher(this)
  }
}
```

由上述代码，异步观察者会执行 queueWatcher 方法，在下一个 tick 中调用 run() 方法，而配置了 sync 为 true时，在调用 watcher 的 update 方法时同步地执行了 run 方法。

这个属性一般在开发的时候不会用到，在 Vue 提供的官方测试工具库中，数据的改变会以同步的方式触发组件的变更，这就是通过执行观察者为同步的，其实现不是通过手动将所有观察者转换为同步，而是通过了 Vue.config.async 这一全局配置，将其置为 false，而在 queueWatcher 函数内部：

```js
export function queueWatcher (watcher: Watcher) {
  const id = watcher.id
  if (has[id] == null) {
    // 省略...
    // queue the flush
    if (!waiting) {
      waiting = true

      if (process.env.NODE_ENV !== 'production' && !config.async) {
        flushSchedulerQueue()
        return
      }
      nextTick(flushSchedulerQueue)
    }
  }
}
```

如果 Vue.config.async 为 false，则也会同步的执行 flushSchedulerQueue，而不是在下一个 tick。

### 什么是 VDOM，使用 VDOM 的意义

### Proxy 和 Object.defineProperty 的对比 （引申为后者的缺点、proxy 的优势或与 Vue 3 的对比）

### keep-alive 的实现

## 编译层

### 编译原理

### key 的作用

### Diff 算法

## 应用层

### 组件间通信 （方法，废弃的 dispatch 的实现）

### 封装一个简易的组件库（参考 Element）

+ [实现一套组件库](https://juejin.im/post/5e200ee86fb9a02fdd38986d)
+ element 源码阅读
+ [一篇文章搞定 babel-plugin-import 插件](https://juejin.im/post/5eefff756fb9a0589b027d97)

### 性能优化

## 配套周边

### Vuex 的实现

### Vue-router

+ hash 与 history 的对比

## 框架层 

### MVC/MVVM 的理解

### 与 React 的对比