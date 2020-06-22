## 原理层

### 生命周期的理解（各阶段做了什么，在什么时机触发）

#### 有哪些生命周期

#### 父子组件生命周期执行顺序（结合源码实现）

### 双向绑定的实现

响应式是机遇 Object.defineProperty 深度遍历对数据对象进行劫持的。每个组件都有自己的渲染 watcher 实例，在 组件 patch 的过程中，会触发数据对象属性的 getter，从而收集到相应的 watcher。在对于数据对象属性进行修改的时候，会触发对应的 setter，从而通知 watcher ，会将其放置到一个缓存队列中，通过 next-tick 在下一个循环中遍历更新对应的组件渲染。

### 对数组的特殊处理

### next-tick的实现

异步队列更新用来解决避免修改多个属性值时，每一个属性的更改都触发重新渲染的问题。通过将 watcher 放进一个队列中，同时判断不会重复添加，当所有的变化完成时，一次性更新队列中所有 watcher 的更新。

优先使用 microTask，往后逐渐降级为 macro task 的 setTimeout：

1. promise.then
2. MutationObserver
3. setImmediate
4. setTimeout

原因在于，往往两个 macro task 之间会穿插 UI 渲染（例如 v-on 绑定的事件回调回强制走 macro task）。结合 JS 执行任务队列机制，调用栈空闲后会执行先清空 micro task 队列，然后才会执行下一个 macro task。因此可以优先在 micro task 中把 UI 渲染之前需要更新的数据全部更新，这样只需一次渲染就能得到最新的 DOM。

### computed 与 watch 的实现与对比

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