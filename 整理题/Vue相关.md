## 原理层

### 为什么 data 必须是函数

### 生命周期的理解（各阶段做了什么，在什么时机触发）

#### 有哪些生命周期

#### 父子组件生命周期执行顺序（结合源码实现）

### 双向绑定的实现

响应式是基于 Object.defineProperty 深度遍历对数据对象进行劫持的。每个组件都有自己的渲染 watcher 实例，在 组件渲染的过程中（严格来说是生成 VNode时），会触发数据对象属性的 getter，从而收集到相应的 watcher。在对于数据对象属性进行修改的时候，会触发对应的 setter，从而通知收集到的依赖 watcher 进行更新，将它们放置到一个缓存队列中，通过 next-tick 在下一个循环中遍历更新对应的组件渲染。

### 对数组的特殊处理

在 Vue 中无法监听到数组的变动，如通过索引值改变数组项，或直接修改数组的长度。

实际上，Object.defineProperty 可以根据下标监听数组的变化，Vue 在代码层面屏蔽了这一逻辑，并且重写了数组中 splice、push 等方法。

```js
if (Array.isArray(value)) {
  if (hasProto) {
    protoAugment(value, arrayMethods)
  } else {
    copyAugment(value, arrayMethods, arrayKeys)
  }
  this.observeArray(value)
} else {
  this.walk(value)
}
```

```js
// 数组方法重写
import { def } from '../util/index'

const arrayProto = Array.prototype
export const arrayMethods = Object.create(arrayProto)

const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]

/**
 * Intercept mutating methods and emit events
 */
methodsToPatch.forEach(function (method) {
  // cache original method
  const original = arrayProto[method]
  def(arrayMethods, method, function mutator (...args) {
    const result = original.apply(this, args)
    const ob = this.__ob__
    let inserted
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args
        break
      case 'splice':
        inserted = args.slice(2)
        break
    }
    if (inserted) ob.observeArray(inserted) // 将新增值变为响应式对象
    // notify change
    ob.dep.notify() // 手动触发依赖更新
    return result
  })
})
```

重写后，对于新插入的值，会将其变成一个响应式对象，在调用 notify 方法。

因此当我们针对只含有基础类型值的数组时，无法通过下标直接修改对应的数组项，必须使用 splice 等方法来修改数组，原因就在于 Vue 并没有通过 Object.defineProperty 来监听数组下标。

针对数组的限制，有以下说法：
+ 在不知道数组长度的情况下，如果数组的长度很大，预先加载 getter/setter 性能负担较大
+ 数组的 length 属性重定义是可能的，但是会受到一般的重定义限制。并不是所有的浏览器都允许 Array.length 的重定义。
+ 作者从性能体验的性价比考虑后弃用。

### $set 与 $delete 的实现

### 依赖的收集与移除

在初始化阶段，分别对 computed 和 watch 触发 依赖的收集。

在 render 过程中，会触发对渲染 watcher 的收集，此时 watcher 中通过数组对 dep 的缓存来避免重复的收集

同时当某一部分条件渲染的模板不再渲染，那么会移除订阅相关的观察者，避免数据改变时仍然触发其订阅的回调，避免浪费。

```js
// 相关方法
addDep (dep: Dep) {
  const id = dep.id
  if (!this.newDepIds.has(id)) {
    this.newDepIds.add(id)
    this.newDeps.push(dep)
    if (!this.depIds.has(id)) {
      dep.addSub(this)
    }
  }
}
/**
 * Clean up for dependency collection.
 */
cleanupDeps () {
  let i = this.deps.length
  while (i--) {
    const dep = this.deps[i]
    if (!this.newDepIds.has(dep.id)) {
      dep.removeSub(this)
    }
  }
  let tmp = this.depIds
  this.depIds = this.newDepIds
  this.newDepIds = tmp
  this.newDepIds.clear()
  tmp = this.deps
  this.deps = this.newDeps
  this.newDeps = tmp
  this.newDeps.length = 0
}
```

### Proxy 和 Object.defineProperty 的对比 （引申为后者的缺点、proxy 的优势或与 Vue 3 的对比）

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

### keep-alive 的实现

### Vue 的事件机制（emit/on/once/off）

### Vue 的渲染过程

## 编译层

### 编译原理

### Diff 算法 (组件的更新)

当数据更新时，会触发 watcher 的回调函数，对于渲染 watcher，回调函数再次调用了 patch 方法，传入了旧 vnode 与当前新的 vnode。

在 patch 方法中，走得是和初次渲染不同的分支逻辑。首先判断新旧 vnode 是否相同：

```js
function sameVnode (a, b) {
  return (
    a.key === b.key && (
      (
        a.tag === b.tag &&
        a.isComment === b.isComment &&
        isDef(a.data) === isDef(b.data) &&
        sameInputType(a, b)
      ) || (
        isTrue(a.isAsyncPlaceholder) &&
        a.asyncFactory === b.asyncFactory &&
        isUndef(b.asyncFactory.error)
      )
    )
  )
}
```

即判断了 tag、key 等。

#### 新旧节点不相同

这种情况下会直接替换已经存在的节点

+ 创建新节点

这里以旧节点为参考节点，调用 createElm 方法。

+ 更新父的占位符节点
+ 删除旧节点

#### 新旧节点相同

新旧节点相同时会调用 patchVnode 方法。

+ 调用 prepatch 钩子，更新 vnode 实例属性

+ 调用 update 钩子，执行 module 及用户自定义的 update 钩子函数

+ patch 过程

  + 如果是一个文本节点，则直接替换文本内容
  + 如果不是文本节点，判断是否 child vnode 是否存在
    + 存在且不相等的情况下，调用 updateChildren 方法进行 diff 对比
    + 如果只有新 ch 存在，则表示不需要旧节点，如果旧节点是文本节点，将其文本清除。然后将 ch 批量插入到新节点 elm 下
    + 如果只有 oldCh 存在，表示更新的节点为空，则直接将旧节点移除

+ 调用 postpatch 钩子函数，执行组件自定义的钩子函数

#### Diff

该算法比较的内核在于找到新旧节点中相同的节点，**实现节点的复用**。这里的寻找是指相同层级且有相同父级节点的情况。

元素级别的 diff 是通过 updateChildren 方法进行更新。当新旧节点的字节点都存在且不相等的情况下调用。

首先定义了四个索引位置及其对应位置的 vnode，分别是新旧字节点的头尾两个节点。

整个过程中通过 while 循环遍历，核心逻辑是通过对比新旧节点的字节点列表，找出列表中相同的节点，将相同的旧节点移动到新的位置上。如果旧节点列表中不存在新节点，则创建新节点。最后删除旧列表中的旧节点。  

具体的过程如下：

+ 创建新旧列表的头尾索引。
+ 进行 while 循环，条件是 oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx
  + 如果 旧头 和 新头 相同，调用 patchVnode，二者 index 自增
  + 如果 旧尾 和 新尾 相同，调用 patchVnode，二者 index 自减
  + 如果 旧头 和 新尾 相同，调用 patchVnode，并将 旧头 插入到 旧尾 位置之后，旧头增，新尾减
  + 如果 旧尾 和 新头 相同，调用 patchVnode，并将 旧尾 插入到 旧头 位置之前，旧尾减，新头增
  + 如果不满足以上条件，则会尝试在 旧头 到 旧尾 之间找到和 新头 相同的节点，如果存在，则调用 patchVnode并将其插入到 旧头 位置之前；若不存在则创建新的元素插入 旧头 之前，新头增。
+ 循环结束后，如果 旧头 大于 旧尾，则说明**最新的** 新头 与 新尾 之间的节点是旧节点列表中不存在的，需要将其添加到 DOM 中；如果 新头 大于 新尾，则说明**最新的** 旧头 和 旧尾 之间这些节点是新列表没有的，需要将其从 DOM 中删除。

### key 的作用（为什么不要用 index）

key 作为唯一的标记，可以让整个 diff 操作更快速准确。准确体现在 vnode 对比时可以避免就地复用的情况，保证渲染的准确性。例如列表中每一行都包含一个文本输入框，删除中间某一行后，文本库的内容异常。

在 diff 过程中四种匹配方式都没有命中的情况下，会生成以 key 为键值的 map 对象来获取对应的节点，这种方式比不设置 key 遍历节点来的快速。

### Vue3 中的 Diff

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