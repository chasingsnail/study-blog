## 原理层

### 为什么 data 必须是函数

组件是复用，如果 data 是一个对象，那么所有的子组件的 data 有着同一份引用，属性会相互影响。

通过 new Vue 的示例对象 data 可以使用对象是因为其是一个单独的实例，不会被复用

### 生命周期的理解

+ beforeCreate

  初始化 lifeCycle、Events，这时 data、props、methods还未初始化

+ created

  初始化 `props`、`data`、`methods`、`watch`、`computed` 等属性完成，dom还未生成

+ beforeMount

  在执行生成 Vnode 之前调用了 beforeMount

+ mounted

  在执行 patch 之后，生成真实 DOM 调用 mounted 钩子

+ beforeUpdate

  定义在渲染 watcher 的 before 方法中，当响应式数据修改时触发

+ updated

  watcher 的回调函数执行完成之后调用

+ beforeDestroy

  ​	调用 $destroy 开始的时候触发，通过 patch 空 Vnode 来删除

  + 解绑自定义事件
  + 销毁定时器
  + 解绑自定义 DOM 事件

+ destroyed

  执行完一系列销毁动作，包括删除子节点，删除watcher 之后 调用

+ activated

  kee-alive 包括的组件渲染时调用

+ deactivated

  发生在 `vnode` 的 `destory` 钩子函数

#### 父子组件生命周期执行顺序

初始渲染：父beforeCreate->父created->父beforeMount->子beforeCreate->子created->子beforeMount->子mounted->父mounted

子组件更新：父beforeUpdate->子beforeUpdate->子updated->父updated

组件销毁：父beforeDestroy->子beforeDestroy->子destroyed->父destroyed

### 双向绑定的实现

Vue 是用了代理加上发布订阅模式，对对象进行数据劫持，在数据变动时派发更新通知订阅者，触发相应的回调。

首先在初始化时，通过 Object.defineProperty 对数据对象进行深度遍历，给每个属性添加上 setter 和 getter 的属性描述符，这样通过访问这个值触发 getter 收集依赖，改变某个值时，触发 setter 进行通知更新。

组件的 render 是由渲染 watcher 来代理执行的，每个组件实例都对应一个 **watcher** 实例。在渲染页面的过程中，会初始化渲染 watcher ，watch 在执行之前会将自身添加到全局变量中 Dep.target。在生成 Vnode 的过程中，这时会访问 data 中定义的响应式数据，由此触发数据对象相应的 getter，收集到了全局变量 watcher 作为自身依赖。（收集到 watcher 是存放在 Dep 实例 的 subs 中，其中 Dep 实例通过闭包的方式可以在 getter 和 setter 中访问到）

当响应式数据发生变动派发更新时，触发相应的 setter，通知所有的依赖进行更新，也是通过 watcher  去重新调用渲染更新方法，经过一些的 diff 比较，得到更新之后的 vnode 。watcher 的更新不是立即执行的，而是会将他们放置在一个缓存队列中，通过 nextTick 在下一个循环中一次性更新完成。

简：响应式是基于 Object.defineProperty 深度遍历对数据对象进行劫持的。在 组件渲染的过程中（严格来说是生成 VNode时），会触发数据对象属性的 getter，从而收集到相应的 watcher。在对于数据对象属性进行修改的时候，会触发对应的 setter，从而通知收集到的依赖 watcher 进行更新，将它们放置到一个缓存队列中，通过 next-tick 在下一个循环中遍历更新对应的组件渲染。

### 对数组的特殊处理

在 Vue 中无法监听到数组的变动，例如通过索引值改变数组项，或直接修改数组的长度。

实际上，Object.defineProperty 可以根据下标监听数组的变化，Vue 在代码层面屏蔽了这一逻辑，并且重写了数组原型中的 splice、push 等方法。

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

### Object.defineProperty 缺点

+ 深度监听需要深度递归，一次性计算量大
+ 无法监听新增或删除属性 
+ 无法监听数组操作方法

### set 与 delete 的实现

#### $set

如果是一个新的响应式数据，通过 defineReactive 来将其变为响应式，并手动调用触发依赖通知。

#### del

手动删除对象中的相应的值（ delete 方法），并手动调用触发依赖通知。

### 依赖的收集与移除

在初始化阶段，分别对 computed 和 watch 触发 依赖的收集。

在 render 过程中，会触发对渲染 watcher 的收集，此时 watcher 中通过数组对 dep.id 的缓存来避免重复的收集

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

### Vue 3 vs. Vue 2

#### 响应式

#### proxy 的优劣

Proxy 可以直接监听对象和数组的变化，并且有多达13种拦截方法。proxy 可以直接劫持整个对象，并返回一个新的对象。

+ 不像 Object.defineProperty 需要对每个属性进行代理。因此，Vue 3 不需要在初始化阶段递归劫持所有属性的 get

+ Proxy 拦截的是 「修改 data 上的任意 key」 和 「读取 data 上的任意 key」，无论是该属性是已有的还是新增的

+ proxy 可以直接对数组进行操作（push、splice 等） *

+ proxy 拦截方式多，例如 apply、has 等 *

+ proxy 劣势在于其兼容性问题，且无法完美得 polyfill 方案。

#### 注意点

+ 默认行为

  使用 Reflect 返回默认行为，避免无用触发

+ 深度观测

  利用了 Reflect 返回数据类型做判断，如果是一个对象，则再执行 reactive 方法。这样做相比于 Vue2 的数据劫持，前者仅会在 get 时才递归监听，后者在初始化时已经深度遍历劫持

  ```js
  const res = Reflect.get(target, key, receiver)
  // ...
  if (isObject(res)) {
    return isReadonly ? readonly(res) : reactive(res)
  }
  ```

+ 避免触发多次（监测数组时）

  针对数组的操作，例如 push，会触发多次 set 的执行，同时也会引发 get 的操作。Vue 3 中在 set 时利用了 hasOwnProperty 来判断触发的 key 是否为当前自身的属性来决定是否 trigger。同时也可判断新旧值是否相同。

  ```js
  const hasOwnProperty = Object.prototype.hasOwnProperty
  export const hasOwn = ( val, key ) => hasOwnProperty.call(val, key)
  
  const hadKey = hasOwn(target, key)
  if (!hadKey) { // 新增的 key
    trigger(target, TriggerOpTypes.ADD, key, value)
  } else if (hasChanged(value, oldValue)) { // 判断新旧值是否相等
    trigger(target, TriggerOpTypes.SET, key, value, oldValue)
  }
  ```

  例如：

  ```js
  var data = [1, 2]
  var r = reactive(data)
  r.push(3)
  ```

  在 set 时，第一次的 val 是 [1, 2], key 为 2，因此 hasOwn 的结果为 false，说明这是一个新增的操作。第二次是 key 是 length，而 target['length'] 也是 4，因此不执行任何语句。

  由此，来实现避免多余的 key。

#### Vue 3 响应式过程

Vue 3 通过 reative 方法完成对数据的响应式代理。其本质是通过 proxy 进行数据劫持。通过 get 和 set 进行依赖收集和派发更新。

在组件渲染的时候，会给当前的实例创建一个 effect，类似 Vue2 中的 Watcher，并且当全局变量 activeEffect 赋值为 effect。

在过程中触发 get 时，会进行依赖收集，首先会往全局的 weakMap 里创建对应的 key，这个  key  对应的 value 初始化为 Map，对于每个属性 key，作为 Map 的key，它们的 value 是 Set ，通过 Set 来保存依赖的 effect。在触发 get 时，会收集到 activeEffect，也就是当前渲染实例的 effect，类似于 Vue 2 的依赖收集过程。

在派发更新，触发了 set 时，把这些收集到的 effect 存到一个集合中，在下一个 tick 中执行清空所有的 effect。

#### 静态节点提升 shapeFlag

生成 Vnode 树时，会给每个节点打上 shapeFlag 标记，表示不同类型的节点。在最终 patch 阶段，会根据这个 flag 来进行不同的更新，相比于 Vue2 的 patch 更加灵活。

### next-tick的实现

#### 作用

在下次 DOM 更新循环结束后执行延迟回调，在修改数据之后立即使用 `nextTick` 来获取更新后的 DOM。

#### 实现

Vue 内部首先会进行当前环境 api 支持的判断。优先使用 microTask，往后逐渐降级为 macro task 的 setTimeout：

1. promise.then
2. MutationObserver (监听 DOM 树的更改)
3. setImmediate
4. setTimeout

nextTick 函数接收到一个回调后不会立刻去执行它，而是将这些回调函数 push 到一个队列中。如果同一个 watcher 被多次触发，只会被推入到队列中一次。这样可以去除重复数据对于避免不必要的计算和 DOM 操作是非常重要的。等待一个时机将队列全部清空。这里的时机就是上述的任务队列。优先微任务队列。

原因在于，往往两个 macro task 之间会穿插 UI 渲染（例如 v-on 绑定的事件回调会强制走 macro task）。结合 JS 执行任务队列机制，调用栈空闲后会执行先清空 micro task 队列，然后才会执行下一个 macro task。因此可以优先在 micro task 中把 UI 渲染之前需要更新的数据全部更新，这样只需一次渲染就能得到最新的 DOM。如果使用的是 task，回调队列会在当前 task 和 微任务队列执行完成后的之后某个 task 中处理，这时候可能已经进行了多次的 UI 渲染（UI 渲染本身是一个宏任务），这就会导致 DOM 操作的延迟。

#### 应用

1. 获取数据更新之后的 DOM

2. Vue 使用异步队列更新，这样做时为了避免修改多个属性值时，每一个属性的更改都触发重新渲染的问题。通过将 watcher 放进一个队列中，同时判断不会重复添加，当所有的变化完成时，一次性更新队列中所有 watcher 的更新。

### computed 与 watch 的实现与对比

#### computed

1. computed 是 Vue 中的计算属性，应用在某个值是依赖了其它的响应式对象甚至是计算属性计算而来的场景。

2. computed 本质上也是一个 **watcher** 实例。在计算属性初始化阶段，先会初始化对应的 computed watcher 实例，接着通过 Object.defineProperty 对数据对象进行代理，添加 getter 和 setter。和渲染 watcher 的区别在于，computed watcher 在初始化构造函数中不会进行求值的操作，因为计算属性可能依赖了其他的计算属性，而在初始化阶段还拿不到其他计算属性的值。

3. 当在渲染 patch 中，触发了 computed 属性的 getter，首先会对其进行求值，求值的过程中会触发其依赖的所有响应式数据的 getter，因此所有依赖数据的 Dep 订阅了 computed watcher（同时 computed watcher 的 deps 收集到了依赖数据的 dep），并且每个依赖数据的 dep 收集到渲染 watcher（watcher.depend -> this.deps[i].depend）。

4. 计算属性是有**缓存**的，主要体现 watcher 内部使用了 dirty 用了标识数据是否需要重新计算求值。在第一次求值完成后，会将 watcher 内部的 dirty 标识置为 false。如果有其他地方访问到这个数据时，发现 dirty 是 false，就会直接读取。当计算属性的依赖数据变化时，会通知 watcher 将自身的 dirty 置为 true，当下次被访问到这个值的时候，会重新求值并且再次把 dirty 置为 false。

5. 当依赖数据改变时，触发其 dep 中收集到的 watcher 的更新，此时 watcher 中含有 computed watcher 与 渲染 watcher。当在触发渲染 watcher 更新的过程中，又会触发这些响应式的数据的 getter，在对应的计算属性值的 getter 中会去获取其最新的值渲染到页面上。

相对比于旧版 Vue 的实现，新版让依赖数据的 dep 持有 computed watcher 与 渲染 watcher，在调用 computed watcher 时，会将 this.dirty 置为 true（为了后续调用 evaluate 方法），调用渲染 watcher 时，获取 computed 最新的值。旧版实现为，在computed watcher 实例内部初始化了一个 dep，并收集了渲染 watcher。当依赖数据对象改变时，触发了 computed watcher 的更新，此时获取到该计算属性的最新值与旧值做对比，如果不同则会调用实例中 dep 持有的渲染 watcher 更新，由此触发了页面的重新渲染。

区别在于渲染 watcher 订阅了谁的变化，新版中为依赖数据的 dep，（依赖最终 patch 过程中判断是否新旧值相同？？）。旧版为 comptued watcher 实例自身的 dep，直接判断新旧值是否相同来决定是否触发渲染 watcher 更新。

#### watch

侦听属性 watcher 也是根据用户的定义，通过生成 watcher 实例来实现的。本质上也是一个 watcher。同样地，在构造函数内初始化阶段（option.user = true）会调用 this.get() 方法，获取到该 watcher 对应的数据对象值，这时候会触发数据对象的 getter，收集到侦听属性的 watcher。

+ deep

如果侦听的值是一个对象并且配置了 deep 属性为true，则会深度遍历对应的数据对象，在遍历的时候会触发对象子属性的 getter，此过程中也会不断发生依赖收集，这样就可以对象下的每个子属性都会收集到这个 watcher。如果不开启 deep，则只能够触发对象最外层属性的 getter，对其子属性的更改则不会触发更新。

如果只是想监听对象中某一个属性的变化，可以直接对该属性进行 watch 而不需要设置 deep 监听整个对象变化造成浪费。

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

虚拟 dom，让我们通过 JS 对象来描述 dom 的具体结构： 可以通过 tag（标签）、props（属性、样式、事件等）、children（子元素） 

作用：

+ 减少 DOM 操作，vdom 存在的情况下仅替换更改的 dom，而非整体替换。它可以将多次操作合并成一次操作，在大量、频繁的数据更新下，能够对视图进行合理、高效的更新。
+ 跨平台，本质上是一个对象结构，不依赖于平台环境，因此可以具有跨平台的能力，例如 RN

JS 计算的执行速度较快， Vdom 是通过使用 js 来模拟 DOM 结构，计算出最小的变更，来操作 DOM。

框架实际上是一个性能与可维护性的取舍，它可以为我们掩盖底层的 DOM 操作，可以让我们用声明式的方法来维护代码。**框架中使用 vdom 不可能比纯手工优化过的 DOM 操作更快（diff 不是免费的）。我们不可能在每个地方都去做手动优化，处于可维护性来考虑，框架给到我们的是在保证不需要手动优化的情况下，给我们提供一个过得去的性能。**

Virtual DOM render + diff 显然比渲染 html 字符串要慢，但是！它依然是纯 js 层面的计算，比起后面的 DOM 操作来说，依然便宜了太多。可以看到，innerHTML 的总计算量不管是 js 计算还是 DOM 操作都是和整个界面的大小相关，但 **Virtual DOM 的计算量里面，只有 js 计算和界面大小相关，DOM 操作是和数据的变动量相关的，在频繁的小规模数据更新的情况下有优势**。前面说了，和 DOM 操作比起来，js 计算是极其便宜的。这才是为什么要有 Virtual DOM：**它保证了 1）不管你的数据变化多少，每次重绘的性能都可以接受**；2) 你依然可以用类似 innerHTML 的思路去写你的应用。

diff 并不是免费的，在最终 patch 的时候依然需要调用原生 API。

总结，VDOM 的使用并不是纯粹为了性能，而是保证了无论更新数据量的多少，性能都可以接受。相比于所有数据都变了，那么直接使用原生优化过的手段操作 DOM 实际上会比较优秀，但是如果小规模的数据更新情况下，VDOM 只有 js 的计算和界面大小相关，而 DOM 的操作则是和数据的变动量有关，这里可以体现出优势。VDOM 的价值让我们可以使用函数式 UI 编程，并还能够把 DOM 渲染到其他的端，例如 RN。

在初次渲染的时候 react 由于需要生成 VDOM 再去渲染真实 DOM，这个过程会比原生慢，但是之后每一次渲染，都会快过于。

### v-model 的实现

本质是一个语法糖，会在运行时作一些优化（输入法事件）

实现的本质是通过在 parse addProp 和 addHandler 方法添加 prop 和 执行事件，相当于传入了 value 的 prop，以及监听了 input 事件。

另外在运行时 patch 阶段执行 directive module 钩子的时候，会额外监听 compositionstart 和 compositionend 事件，解决之道输入法开始输入汉字时而非刚输入字母时就触发事件的问题。

#### 组件  v-model 的实现

在 parse 阶段相同，区别在于 codegen 阶段，通过调用 genComponentModel 方法。

在 编辑阶段会生成一个 model 对象，包含 value、callback、expression，用于运行时阶段将其转换为 props 和 events。

### v-show 与 v-if

对于 v-if 而言，如果初始值是 false，则什么都不会做。只有当为 true 时才会去渲染。而 v-show 无论初始条件是什么都会进行渲染，因此它的初始渲染开销更大。

由于 v-if 在切换过程中会对子组件以及事件监听销毁和重建，而 v-show 只是基于 css display 的切换。因此 v-if 切换开销更大。在需要频繁切换的场景下，v-show 合适，反之使用 v-if。

### v-html

该指令能够动态渲染任意 HTML，带来 XSS 攻击的风险。

### 命令式 API 调用组件

可以通过 vm.$mount() 先生成一个未挂载的 Vue 实例。并且可以通过原生 DOM API 来将它插入到文档流中：

```js
var MyComponent = Vue.extend({
  template: '<div>Hello!</div>'
})

var instance = new MyComponent()
instance.$mount() // 此时未挂载
document.body.appendChild(instance.$el) // 手动通过原生 API 挂载
```



### 指令的实现

在模板编译阶段，会解析指令添加到 AST 树中，并且最终可以通过 Vnode 中的属性获取到节点绑定的指令。在进行节点比对时，会触发一系列 module 钩子函数，这其中就包含了指令相关的钩子，最终根据不同的情况触发指令内的钩子函数。

### slot 的实现

普通插槽

父组件编译节点会给 AST 添加一个 slotTarget 属性，在生成代码阶段处理这个属性，添加上一个 slot 属性并指向定义的 slotTarget（slot="slotTarget"）。

子组件遇到 slot 标签时，会给对应的 ast 元素节点添加 slotName 属性（这里的 slotName 对应父组件的 slotTarget），在 codegen 计算，会判断是否为 slot 标签，执行 genSlot 方法。

编译的顺序是先父后子。父组件完成编译后会生成插槽节点对应的 vnode，数据的作用域是父组件实例。在子组件 init 时，此时父组件已经编译完成，维护了一个 slots 对象按插槽名称 key 获取父组件中对应的编译完成后的 child 节点 Vnode 。在子组件生成 slot 节点时，可以借助这个 slots 对象，拿到已经渲染好的 vnode，实现了在父组替换子组件插槽的内容了。

作用域插槽

在父组件渲染时不会生成对应的 vnode，而是在父组件的 Vnode 中保留了一个 scopedSlots 对象，存储着不同名称的插槽以及它们对应的渲染函数，只有在编译和渲染子组件阶段才会拿到并执行这个渲染函数生成 `vnodes`，由于是在子组件环境执行的，所以对应的数据作用域是子组件实例。

```js
// 子组件编译
function genSlot (el: ASTElement, state: CodegenState): string {
  const slotName = el.slotName || '"default"'
  const children = genChildren(el, state)
  let res = `_t(${slotName}${children ? `,${children}` : ''}`
  const attrs = el.attrs && `{${el.attrs.map(a => `${camelize(a.name)}:${a.value}`).join(',')}}` // 获取传入的 slotProps 数据
  const bind = el.attrsMap['v-bind']
  if ((attrs || bind) && !children) {
    res += `,null`
  }
  if (attrs) {
    res += `,${attrs}`
  }
  if (bind) {
    res += `${attrs ? '' : ',null'},${bind}`
  }
  return res + ')'
}

// 生成结果
with(this){
  return _c('div',
    {staticClass:"child"},
    [_t("default",null,
      {text:"Hello ",msg:msg} // 子组件中对应的 slotProps 数据
    )],
  2)}
```

最主要的区别在于数据的作用于会根据他们 vnode 渲染时机的不同而不同，前者是在父作用域生成好了 vnodes，后者是在子组件作用域中才调用渲染函数生成 vnode。

### keep-alive 的实现

+  实现
+ 对组件的渲染的生命周期有什么影响 （active）
+ 有哪些特性


在 keep-alive 初始化阶段，会调用它的 render 方法生成 vnode。在 render 方法中获取到子组件 A 的 vnode （本质上是一个 slot 普通插槽，因此其在父组件渲染过程中已经生成好 vnode），将其缓存在 cache 中，并设置其 vnode.data.keepAlive 为 true。接着是 patch 子组件，接着与普通节点渲染没有区别

当进行组件切换时，在 patch 过程中会执行 prepatch 钩子，重新解析 keep-alive 的 slot ，执行组件的强制渲染。此时会再次执行 keep-alive 组件的 render，拿到 B 组件的 vnode 并也将它存在 cache 中。执行 patchNode 过程（删除旧的A，创建新的B）。 

当再切换回 A 组件时，会再一次进入 keep-alive 组件的 render 方法中，此时会从 cache 中读取 A 组件的 vnode。 接着进入 patch 阶段， 在创建组件节点，不再进入创建组件实例并且 mount 挂载的过程，而是直接执行 prepatch 钩子，之后直接将 A 组件插入。接着执行 active 相关生命周期。

总结，它的实现通过了自定义 render 并且利用了插槽。通过 cache 了组件的 vnode，直接拿到组件实例，获取组件 dom 和状态

#### 总结

keep-alive 可以让我们在组件切换的时候保存先前组件的状态，以避免反复重渲染导致的性能问题。它的实现本质上是通过 slot 插槽来实现的，渲染插槽内的组件时会将对应的 vnode 缓存到 cache 变量中。当组件切换回到初始组件时，会去读区 cache 中的 vnode ，这时候再去渲染的时候就不会去创建组件实例和挂载，而是直接将组件插入，触发 active 相关的生命周期。


### Vue event 事件

事件分别在 parse 和 codegen 过程中构成，运行时在 patch 中执行各种 module 的钩子时挂载了定义的事件。

原生事件最终通过 addEventListener 和 removeEventListener 来实现绑定和解绑。

组件的自定义事件是通过 Vue 定义的事件中心来实现的 （$once / $on）


### Vue 的事件机制（emit/on/once/off）

事件机制是订阅发布模式的实现。把所有的事件听过 vm.events 存储，当执行 $on 时，按事件名称 event 将回调函数 fn push 到 event 对应的数组中。在通过 $emit 触发时，找到 event 对应的所有回调函数，遍历执行。 当调用 $off 时，清除制定的回调函数。

这也是父子组件通信的实现，它的回调函数是定义在父组件中，因此当通过 $emit 派发事件是，子组件的实例监听到了这个事件后执行了它的回调函数，即定义在父组件中的方法。 

## 编译层

### 编译原理（过程）

Vue的编译过程就是将`template`转化为`render`函数的过程。

+ parse

  **目标是把 `template` 模板字符串转换成 AST 树**。执行 parseHTML 方法，**利用正则表达式顺序解析模板**，当解析到开始标签、闭合标签、文本的时候都会分别执行对应的回调函数，**这个过程中会分析标签中的属性、事件等等，最终构造 AST 树。*其中利用 stack 栈保证元素的正确闭合。最终生成的 AST 元素节点有3种类型，1 - 普通元素；2 - 表达式；3 - 纯文本****

+ optimize 优化

  **一些非响应式的数据不会使 DOM 变化，因此在渲染 patch 过程中可以跳过对这些节点的对比。**判断的依据是根据其是否为表达式，即type === 3。如果 type 为 1则会深度遍历它所有的 children，检测它的每一颗子树是不是静态节点。而静态根节点（type 为 1） staticRoot 的判断依据是，除了本身是一个静态节点外，还必须有 children且 children 不能只是一个文本节点。如果是静态节点则它们生成 DOM 永远不需要改变，这对运行时对模板的更新起到极大的优化作用。**static / staticRoot 字段。**

+ Codegen 将 AST 转换为可执行代码

  **通过执行各种 genXXX 方法将 ast 上的属性通过字符串拼接变为函数字符串。执行结果包裹在 with 语句中。接着会通过 new Function 的方式将其转换为可执行函数赋值给 vm.options.render，**当组件执行 vm._render 的时候，会执行这个 render 函数，vnode = render.call(vm._renderProxy, vm.$createElement) **生成 VNode。**

总结

Vue的编译过程就是将`template`转化为`render`函数的过程。首先回将 template 模板字符串转换为 AST 树，然后对 AST 树进行优化，标记静态节点，在后续节点复用的比对时跳过这些静态节点。最后会将这颗 AST 树编译成一段代码字符串，经过 new Function 的包裹返回，最终由 createElement 函数调用，用于生成 Vnode。

### Diff 算法 

原则

+ 只比较同一层级，不跨级比较
+ 判断一方有子节点一方没有子节点的情况，新 children 无则将旧的删除，旧的无，则新增
+ 都有子节点的情况下进入核心diff算法比较
+ 递归比较子节点

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

利用了双指针原理。首先定义了四个索引位置及其对应位置的 vnode，分别是新旧字节点的头尾两个节点。

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

#### 简述

1. patch
2. patchVnode 、addVnodes 和 removeVnodes
3. updateChildren （key 的重要性）

同级比较，再比较子节点。只有当新旧children都为多个子节点时才需要用核心的Diff算法进行同层级比较。Vue2的核心Diff算法采用了`双端比较`的算法，同时从新旧children的两端开始进行比较，借助key值找到可复用的节点，再进行相关操作。相比React的Diff算法，同样情况下可以减少移动节点次数，减少不必要的性能损耗，更加的优雅。

### key 的作用

key 作为唯一的标记，用于区分不同的 vnode，在新旧节点的对比中找到找到可复用节点，同时避免额外渲染和复用错误节点。

在 diff 算法中会用到 tag 和 key 来判断 vnode 是否相同。

+ 如果不使用 key，那么 vue 会使用就地复用的策略来更新节点，如果子节点有区别，可能会触发额外的删除和创建节点，造成额外的渲染，而不是直接通过移动的操作来复用原有的节点。
+ 在列表中，删除其中一项，如果不加 key 区分，那么删除后新旧 vnode 对比就会出现 bug，因为列表元素 DOM 结构相同，Vue 会把原本不同的两个节点认为是 sameVnode，导致 bug。（例如：如果列表依赖子组件的状态，会让 Vue 复用错节点。例如列表中每一行都包含一个文本输入框，删除中间某一行后，文本输入的内容异常，就会出现错误复用的结果。）

#### 使用 index 作为 key 

问题和不使用 key 的问题相同。（sameVnode 判断相同）

#### 使用随机数作为 key

这样使得 Vue 要重新创建所有的节点，而不会去复用旧 vnode 中的任意一个节点。

### 为什么 v-if 不要和 v-for 一起使用

当 v-for 和 v-if 处在同一个节点的时候，在编译过程中，v-for 的优先级要高于 v-if（v-for 判断早于 v-if），因此通过 VNode 生成的最终代码中，在循环生成每一条数据时都要对 v-if 进行判断，造成了没必要的性能消耗。可以通过把 v-if 绑定在 v-for 的上一级父节点上，或者在给循环列表的数据赋值前进行过滤。

### React Diff

在 react diff 中采用的策略是**遍历新的 children 过程中寻找过程中在旧 `children` 中所遇到的最大索引值**，如果后续寻找过程中发现索引值比最大索引值小的节点，则意味着该节点需要被移动。

移动的策略是，找到一个参考节点，将当前新 child 对应的 dom 插入到这个参考节点之前。这个参考节点是当前新 child 的上一个 child 的真实 dom 节点的下一个兄弟节点。

在新旧 children 遍历结束后，再遍历旧 children，对比新旧 children 中是否有需要移除的旧节点。

该 diff 算法的问题在于会有多余的 DOM 操作开销。

### Vue3 中的 Diff

+ 预处理阶段分别从前往后，从后往前筛选，去除相同的前缀和后缀节点（提前进行 patch ）。筛选完成之后如果新节点为空，则移除旧节点剩余节点；如果旧节点为空，新节点还有剩余，则新创建这些节点。
+ 预处理之后，需要判断哪些节点需要被移动、删除、创建
  1. 首先维护一个数组，长度与**新节点列表中**未处理的节点数量相同，用于记录新列表的节点在旧列表中的位置。

  2. 循环遍历旧节点列表，尝试在新的节点中找到 key 相同的节点，移除没有找到的节点，同时维护更新数组位置信息

  3. 接着就是新增和移动的处理，**从尾到头**遍历数组，如果是新增（0），则新增节点，如果非新增，则表示需要被移动，这时候将其移动至对应的 index （插入到该节点在新节点中位置的下一个节点位置）之前。

  4. 在遍历的过程中，存在不需要移动的节点，即在其他节点移动完成后，这些节点的顺序自然是正确的，因此还会根据数组还维护了一份最长递增子序列，用来标识不需要移动的节点（目的是尽可能多的减少节点移动）。

总结：

在创建VNode时就确定其类型，以及在`mount/patch`的过程中采用`位运算`来判断一个VNode的类型，在这个基础之上再配合核心的Diff算法，使得性能上较Vue2.x有了提升。

该算法中还运用了`动态规划`的思想求解最长递归子序列。

### Vue 3 和 Vue 2 的 Diff 对比

+ 二者同时会先对头尾进行判断，Vue2是双指针的循环
+ 对于无序节点， Vue 3 会直接维护一个数组，标记节点是否需要移动或新增，在标记的过程中会过滤掉移除的点，相同的点直接patch。而 Vue 2 对于无序节点的判断放在了最后，仍然会执行完之前所有的判断。
+ Vue 3 通过维护最长递增子序列减少节点的移动操作

### Vue 3 优化点（待补充）

+ vnode

  + 增强了静态分析，为节点标记为静态节点与动态节点，在 patch 时，只会比较动态节点，静态节点不能进入patch。（Vue 2 中 optimize 过程会标记静态节点略过分析）。
  + 节点类型细化区分。生成的 Vnode 会标记该节点的 **patchFlag**，标识哪些部分可能会有修改。 在 patch 节点有很多地方会根据这个标记作特定的操作。而在 Vue 2 中，普通节点的 patch 会通过内置的 update 钩子进行全量新旧比对然后更新；如果是 component，则会在 prepatch 节点进行判断，有变化触发 forceUpdate。显然在这个过程中会作较多重复无用的对比。

+ 事件优化（待补充）

  Vue 3 可以缓存事件，事件变化不会引起重新渲染。

  Vue 2 中则是每次更新后， vnode 绑定的事件都是一个全新生成的 function，即使其内部代码是一样的，由此出发 events 的 update 钩子

## 应用层

### 组件间通信 （方法，废弃的 dispatch 的实现）

+ vuex
+ event bus
+ emit / on
+ provide / inject
+ dispatch / broadcast
+ props
+ parent（$parent） / children（$ref） 实例对象

### 异步组件

针对本身较大的组件，抽离为异步组件

### Composition API 如何解决 Mixin 带来的问题

mixin 问题

+ 变量来源不明确，不利于代码阅读
+ 多个 mixin 可能会造成命名冲突
+ mixins 和组件有着隐含的依赖关系，还可能会出现多对多的关系，复杂度高，维护困难

composition API 的优势

+ 在导入时，需要显式命名任何状态或从组成函数返回的方法。
+ 隐含依赖关系通过必须将响应式数据显式传递给组合函数

### HOC

Vue 组件导出后与 react 组件不同，它是一个对象的形式，因此在 Vue 中实现 Hoc 本质上是实现一个函数，该函数传入一个组件对象，并同时也返回一个组件对象。这里就需要用到 render 方法。

```js
// hoc.js
export default (wrap) => {
  return render(h) {
    const arg = {
    	// 混入 $attrs
      ...this.$attrs,
      // 传递事件
      on: this.$listeners,
      scopedSlots: this.$scopedSlots
    }
    return h(wrap, arg)
  }
}
```



### 封装一个简易的组件库（参考 Element）

+ [实现一套组件库](https://juejin.im/post/5e200ee86fb9a02fdd38986d)
+ element 源码阅读
+ [一篇文章搞定 babel-plugin-import 插件](https://juejin.im/post/5eefff756fb9a0589b027d97)

### 性能优化

## 配套周边

### Vuex 的实现

#### install

install 阶段通过 Vue.mixin 给每个组件混入 beforeCreate 钩子，作用是把实例化 store 对象的实例保存在所有组件的 `this.$store` 中，让我们可以在组件中通过 `this.$store` 访问到这个实例。

#### 实例化

+ 初始化模块

根据配置，首先获取根模块 root module，通过 register 遍历当前模块中所有的 modules，按 key 作为 path，递归调用 register，最终就建立一颗完整的模块树。

+ 安装模块

  完成了模块下的 `state`、`getters`、`actions`、`mutations` 的初始化工作，并且通过递归遍历的方式，就完成了所有子模块的安装工作。拼接上了各自的 namespace

+ resetStoreVM

  建立 getters 和 state 的联系。遍历 wrapperdGetters，生成对应的 computed 对象。并初始化一个 vue 实例将该对象赋值给计算属性。并且在实例对象的 data 中定义了` $$state`。当访问 store.getters 上的某一个 getter 时，实际上是访问了 vue 实例的计算属性，因此会执行相应的函数从而访问到了实例的 data 中的 state( store.state 实际上是调用了 get state ,访问了 `data.$$state`)。当 store.state 变化时，再次访问 store.getters 就会重新获取新的 state 数值。这样就建立了一个依赖的关系。

  ```js
  get state () {
      return this._vm._data.$$state
  }
  ```

#### API

+ mutation

  在调用 commit 出发 mutation 时，首先找到对应的 module 的 mutation，通过 forEach 的形式遍历触发 handler

+ action

  通过 dispatch 调用，在 action 注册时，会将返回的执行结果包装成一个 promise，在最终调用时，会通过 promise.all 的形式来触发。

  action 方法第一个参数 context 并不等同于 store 实例本身，其内部 dispatch 、commit等方法是挂载在local对象下的，这个local实际上是本地上下文环境，在含有 namespce 的 module 中，在执行dispatch 或 commit 时会将 namespace 和 type 进行一个拼接，实际上触发的是对应module 的 dispatch 和 commit 而非 store 全局的 dispatch commit，因此module 中的 store 是模块的局部状态。

+ mapState、mapGetters、mapMutations、mapActions

  内部主要依赖访问 this.$store 获得对应的 module 下的 state 和 getters，返回相应的值或执行相关 handler。

+ 动态模板更新（模块动态注册功能使得其他 Vue 插件可以通过在 store 中附加新模块的方式来使用 Vuex 管理状态。）

  模块的动态注册实现和初始化类似，首先注册拓展的模块树，接着同样是安装模块、resetStoreVM重新维护 state。

#### 总结

+ 与全局对象的对比 & 如何限制 state 的修改途径

我们在使用时会通过 Vuex.store 生成 store 的实例化对象，并且把它作为 option 传递到 Vue 实例中。这样使得我们在 Vue 代码中可以通过 this.$store 来访问到 store 上的数据 ( install 过程时挂载 )。

Vuex 相比于全局对象而言，它所有存储的数据都是响应式的，如果 store 中的状态发生改变，那么依赖它的组件也会得到更新，这是由于 Vuex 内部在是通过一个 Vue 实例（Vue 的来源是通过 install 的 Vue，因此共享同一个全局变量 Dep.target）来绑定 state 和 getters，当我们在访问 state 或者 getter 时，实际上是在访问内部 Vue 实例上的响应式数据。

另外我们不能直接去改变 store 中的状态，改变的唯一方法是通过 commit，这样可以方便地跟踪每一个状态变化。在 Vue 内部，由于 state 和 getters 实际上是通过 vue 实例关联的。通过除了 commit 方法之外的形式（例如直接改变 store.state 或在 dispatch 过程中改变 state）修改 state 会提示警告。这是由于 Vuex 内部开启了对于 state 的 watch，state 的改变只有在开关 _committing 为 true 的时候才能允许。只有在 mutation 执行之前才会将开关打开。

```js
// 该方法会在触发 commit 时调用，将回调函数传入
Store.prototype._withCommit = function _withCommit (fn) {
  var committing = this._committing;
  this._committing = true;
  fn();
  this._committing = committing;
};
```

+ 为什么 mutation 中不能做异步操作

  这样区分 action 与 mutation 是为了更好的利用调试工具来追踪状态变化。同步的意义在于每个 mutation 执行完成后都可以对应到一个新的状态，这样在调试工具中就可以保存下来。异步操作没有办法知道状态是何时更新的。

### Vue-router 的整体实现

#### 前置知识

+ hash mode 

  监听 hashchange 事件

+ history mode  利用了 History 对象实现

  监听 popstate 用于处理前进后退时调用对应的回调函数

  HTML5引入了 history.pushState() 和 history.replaceState() 方法，history.pushState() 和 history.replaceState() 均接收三个参数（state, title, url）；

  + history.pushState() 在保留现有历史记录的同时，将 url 加入到历史记录中。
  + history.replaceState() 会将历史记录中的当前页面历史替换为 url。

+ hash 与 history 的对比

通过 Vue.mixin 全局混入了 beforeCreate 和 destroy 钩子。因此在每个组件执行 beforeCreate 时，都会执行 router.init 方法，将当前实例放进 apps 中。

#### matcher 

matcher 是一个对象，暴露了两个方法，addRoutes 和 match 。在执行 transitionTo 方法前，会调用 matcher 的 match 方法返回 route。

matcher 中首先会初始化遍历整个 routes 配置，执行 addRouteRecord 方法，给 pathMap（path to record 映射），nameMap（name to record 映射）添加记录，可以让我们通过 name 和 path 快速找到对应的 routeRecord。

addRoutes 方法可以动态添加路由配置，本质上是通过传入新的 routes 配置，执行修改pathList`、`pathMap`、`nameMap 的值。

match 方法用于找到匹配路径的 Route，并且在路由切换时也会触发该方法。通过 name 和 path 从pathMap`、`nameMap 中获取对应的记录，最终返回一个新的 `Route` 对象。所有的 `Route` 最终都会通过 `createRoute` 函数创建，并且它最后是不可以被外部修改的。

#### 路径切换

导航守卫

当切换路由线路时，会先拿到新的路径，执行 confirmTransition 方法。这个过程中，会触发一系列导航守卫钩子。通过异步函数队列依次执行。

按照顺序如下：

1. 在失活的组件里调用离开守卫。
2. 调用全局的 `beforeEach` 守卫。
3. 在重用的组件里调用 `beforeRouteUpdate` 守卫
4. 在激活的路由配置里调用 `beforeEnter`。
5. 解析异步路由组件。
6. 在被激活的组件里调用 `beforeRouteEnter`。（该钩子函数执行时组件还未被创建，可通过 next 回调函数的第一个参数来访问）
7. 调用全局的 `beforeResolve` 守卫。
8. 调用全局的 `afterEach` 钩子。

url

通过 router-link 点击路由跳转时，会执行 router.push 方法，最终执行 transitionTo 方法作路径切换，在切换完成的回调中执行 pushHash 函数，调用浏览器原生 history 的 pushState 或 replaceState 更新浏览器url地址，并将当前 url 压入历史栈中。

在 history 的初始化过程中，会设置一个监听器，通过监听 popstate 或 hashchange 事件来判断浏览器的前进后退按钮出发。

浏览器路径变化：点击跳转时，是调用浏览器原生pushState 或 replaceState 更新浏览器url地址；而操作浏览器前进后退，直接拿到更新后的 url，不需要手动更新 url。

组件

+ router-view

  由于在初始化时，根 Vue 实例的 router 定义成响应式（经过 Object.defineProperty 处理）的。在 render 过程中，都会会访问父组件上的 $route 属性。最终触发这个属性的 getter，收集到了渲染 watcher。在执行完 transitionTo （路径切换）后，会修改这个响应式属性，触发了它的 setter，因此通知 router-view 的渲染 watcher 更新，重新执行了 router-view 组件的 render 渲染，在 render 中获取到当前路由对应的组件，调用 createElement 方法渲染。

+ router-link

   在 render 过程中，首先对路由进行解析，针对标签上特定的 class 做处理。通过监听点击事件（或其他 prop 传入的事件类型）执行函数方法，最终调用 router.push 或 router.replace 方法进行路由跳转。

#### 总结

在进行路由切换时，会把当前的线路切换到目标的线路，在切换过程中会执行一系列导航守卫钩子函数，并且更改 url，同时最后渲染对应的组件。切换完成后把目标的路由切换为当前路由，用作下一次路径切换的依据。

+ hash 模式

  通过监听 hashchange 事件来监听 hash 变化，根据变化来更新页面内容

+ history 模式

  依赖 pushState 和 replaceState 这两个 API 来操作历史栈

## 框架层 

### MVC/MVVM 的理解（待完善）

+ 传统组件需要维护更新 DOM ，Vue 等框架可以通过数据来驱动视图，使开发人员聚焦于数据层，不需要去在 DOM 过于复杂的情况下维护
+ View （DOM）、ViewModel（Vue 各种事件来改变 model ，从而驱动视图更新）、Model（JS Object）

### 框架解决了什么问题

**根本意义**在于解决了UI与数据状态的同步。使用 jquery 避免不了通过 appendChild 、createElement API 操作 DOM来保证UI层和数据层统一。这样带来的问题也是消耗性能，不利于维护。框架的意义在于自动帮我们做了同步的工作，并且在此基础上提供了不错的性能。

使用框架的好处在于：

+ 组件化，易于组合和维护
+ 周边生态：例如 针对数据流向 vuex、redux 的解决方案
+ 代码层解耦：通过 MVVM 等模式使得代码分层更清晰
+ 可结合 VDOM，性能稳定

### 与 React 的对比

+ [Vue3 究竟好在哪里？（和 React Hook 的详细对比）](https://juejin.im/post/6844904132109664264)
+ [为什么说 Vue 的响应式更新精确到组件级别？（原理深度解析）](https://juejin.im/post/6844904113432444942)

## 参考

+ [驳《前端常见的Vue面试题目汇总》](https://juejin.im/post/6844904118704668685)