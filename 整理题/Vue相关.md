## 原理层

### 为什么 data 必须是函数

组件是复用，如果 data 是一个对象，那么所有的子组件的 data 有着同一份引用，属性会相互影响。

通过 new Vue 的示例对象 data 可以使用对象是因为其是一个单独的实例，不会被复用

### 生命周期的理解（各阶段做了什么，在什么时机触发）

+ beforeCreate

  初始化 lifeCycle、Events，这时 data、props、methods还未初始化

+ created

  初始化 `props`、`data`、`methods`、`watch`、`computed` 等属性完成，dom还未生成

+ beforeMount

  在执行生成 Vnode 之前调用了 beforeMount

+ mounted

  在执行 patch 之后，生成真实 DOM 调用 mounted 钩子

+ beforeUpdate

  定义在渲染 watcher 的 before 方法中。

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

#### 父子组件生命周期执行顺序（结合源码实现）

### 双向绑定的实现

Vue 是用了发布订阅模式，通过 Object.defineProperty 深度遍历对对象进行数据劫持的，在数据变动时派发更新通知订阅者，触发相应的回调。

首先在初始化时，对数据对象进行深度遍历，给每个属性添加上 setter 和 getter，这样通过访问这个值触发 getter 收集依赖，改变某个值时，触发 setter 进行通知更新。

在渲染页面的过程中，会生成 Vnode，这时会访问 data 中定义的响应式数据，由此触发数据对象相应的 getter，收集到了相关的 watcher。

watcher 是一个桥梁的作用。每个组件实例都对应一个 **watcher** 实例，在挂载的过程中，初始化渲染 watcher，会将自身添加到全局变量中，在之后渲染过程中，访问响应式数据触发 getter，收集 watcher。当数据变动派发更新时，会触发自身的更新方法执行绑定的回调。

响应式是基于 Object.defineProperty 深度遍历对数据对象进行劫持的。在 组件渲染的过程中（严格来说是生成 VNode时），会触发数据对象属性的 getter，从而收集到相应的 watcher。在对于数据对象属性进行修改的时候，会触发对应的 setter，从而通知收集到的依赖 watcher 进行更新，将它们放置到一个缓存队列中，通过 next-tick 在下一个循环中遍历更新对应的组件渲染。

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

### set 与 delete 的实现

#### $set

如果是一个新的响应式数据，通过 defineReactive 来将其变为响应式，并手动调用触发依赖通知。

#### del

手动删除对象中的相应的值（ delete 方法），并手动调用触发依赖通知。

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

### Proxy 和 Object.defineProperty 的对比 （引申为后者的缺点、proxy 的优势或与 Vue 3 的对比

#### Object.defineProperty 缺点

+ 深度监听需要深度递归，一次性计算量大
+ 无法监听新增或删除属性 
+ 无法监听数组操作方法

#### proxy 的优劣

proxy 可以之间劫持整个对象，并返回一个新的对象。不像 Object.defineProperty 需要对每个属性进行代理。因此，Vue 3 不需要在初始化阶段递归劫持所有属性的 get

proxy 可以之间对数组进行操作（push、splice 等）

proxy 拦截方式多，例如 aplly、has 等

proxy 劣势在于其兼容性问题，且无法完美得 polyfill 方案

#### 响应式过程

Vue 3 通过 reative 方法完成对数据的响应式代理。其本质是通过 proxy 进行数据劫持。通过 get 和 set 进行收集收集和派发更新。

在依赖收集时，初始化一个全局的 weakMap 用来依赖列表，对于每个属性 key，通过 set 来保存依赖这些 key 的 effect。其中 effect 类似于 Vue 2 中的 watcher。在触发 get 时，会收集到当前的 effect，这个 effect 赋值给了一个全局的变量，类似于 Vue 2 的 Dep.target 。由此完成了依赖的收集。

在派发更新，触发了 set 时，会通知 set 中收集到的所有 effect，进行更新渲染。

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

+ 避免触发多次

  针对数组的操作，例如 push，会触发多次 set 的执行，同时也会引发 get 的操作。Vue 3 中在 set 时利用了 hasOwnProperty 来判断出发的 key 是否为当前自身的属性来决定是否 trigger。

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

### 什么是 VDOM，使用 VDOM 的意义 （待完善）

背景： DOM 的操作非常耗性能。

解决方案：JS 计算的执行速度较快， Vdom 是通过使用 js 来模拟 DOM 结构，计算出最小的变更，来操作 DOM。

JS 具体结构： 可以通过 tag（标签）、props（属性、样式、事件等）、children（子元素） 

### v-model 的实现

本质是一个语法糖，会在运行时作一些优化（输入法事件）

实现的本质是通过在 parse addProp 和 addHandler 方法添加 prop 和 执行事件，相当于传入了 value 的 prop，以及监听了 input 事件。

另外在运行时 patch 阶段执行 directive module 钩子的时候，会额外监听 compositionstart 和 compositionend 事件，解决之道输入法开始输入汉字时而非刚输入字母时就触发事件的问题。

#### 组件  v-model 的实现

在 parse 阶段相同，区别在于 codegen 阶段，通过调用 genComponentModel 方法。

在 编辑阶段会生成一个 model 对象，包含 value、callback、expression，用于运行时阶段将其转换为 props 和 events。

### 指令的实现

在模板编译阶段，会解析指令添加到 AST 树中，并且最终可以通过 Vnode 中的属性获取到节点绑定的指令。在进行节点比对时，会触发一系列 module 钩子函数，这其中就包含了指令相关的钩子，最终根据不同的情况触发指令内的钩子函数。

### slot 的实现

普通插槽

父组件编译节点会添加一个 slot 属性并指向定义的 slotTarget（slot="slotTarget"）。

子组件遇到 slot 标签时，会给对应的 ast 元素节点添加 slotName属性，在 codegen 计算，会判断是否为 slot 标签，执行 genSlot 方法。

父组件完成编译后会生成插槽节点对应的 vnode，数据的作用域是父组件实例。在子组件 init 时，维护了一个 slots 对象按插槽名称 key 获取父组件中对应的编译完成后的 child 节点 Vnode 。在生成 slot 节点时，可以借助这个 slots 对象，拿到已经渲染好的 vnode。

作用域插槽

在父组件渲染时不会生成对应的 vnode，而是在父组件的 Vnode 中保留了一个 scopedSlots 对象，通过插槽的 name 存储对应的渲染方法。在编译渲染子组件的过程中会去获取父组件 vnode 中保留的对象，并执行这个渲染函数，生成 vnodes，因为这是在子组件的环境中执行的，因此对应的数据作用是子组件的实例。

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


### Vue event 事件

事件分别在 parse 和 codegen 过程中构成，运行时在 patch 中执行各种 module 的钩子时挂载了定义的事件。

原生事件最终通过 addEventListener 和 removeEventListener 来实现绑定和解绑。

组件的自定义事件是通过 Vue 定义的事件中心来实现的 （$once / $on）


### Vue 的事件机制（emit/on/once/off）

事件机制是订阅发布模式的实现。把所有的事件听过 vm.events 存储，当执行 $on 时，按事件名称 event 将回调函数 fn push 到 event 对应的数组中。在通过 $emit 触发时，找到 event 对应的所有回调函数，遍历执行。 当调用 $off 时，清除制定的回调函数。

这也是父子组件通信的实现，它的回调函数是定义在父组件中，因此当通过 $emit 派发事件是，子组件的实例监听到了这个事件后执行了它的回调函数，即定义在父组件中的方法。 

### Vue 的渲染过程

## 编译层

### 编译原理（过程）

+ parse

  目标是把 `template` 模板字符串转换成 AST 树。执行 parseHTML 方法，利用正则表达式**顺序**解析模板，当解析到开始标签、闭合标签、文本的时候都会分别执行对应的回调函数，这个过程中会分析标签中的属性、事件等等，最终构造 AST 树。其中利用 stack 栈保证元素的正确闭合。最终生成的 AST 元素节点有3种类型，1 - 普通元素；2 - 表达式；3 - 纯文本

+ optimize 优化

  一些非响应式的数据不会使 DOM 变化，因此在优化过程中可以跳过对这些节点的对比。判断的依据是根据其是否为表达式，即type === 3。如果 type 为 1则会深度遍历它所有的 children，检测它的每一颗子树是不是静态节点。而静态根节点（type 为 1） staticRoot 的判断依据是，除了本身是一个静态节点外，还必须有 children且 children 不能只是一个文本节点。如果是静态节点则它们生成 DOM 永远不需要改变，这对运行时对模板的更新起到极大的优化作用。static / staticRoot 字段。

+ Codegen 将 AST 转换为可执行代码

  执行结果包裹在 with 语句中。接着会通过 new Function 的方式将其转换为可执行函数赋值给 vm.options.render，当组件执行 vm._render 的时候，会执行这个 render 函数，vnode = render.call(vm._renderProxy, vm.$createElement) 生成 VNode。

总结

首先回将 template 模板字符串转换为 AST 树，然后对 AST 树进行优化，标记静态节点，在后续节点复用的比对时跳过这些静态节点。最后会将这颗 AST 树编译成一段代码字符串，经过 new Function 的包裹返回，最终由 createElement 函数调用，用于生成 Vnode。

### Diff 算法 

原则（组件）

+ 只比较同一层级，不跨级比较
+ tag 不同，直接删除重建，不会再进行深度比较
+ tag 和 key 相同，两者都相同，则认为是相同节点，不再进行深度比较

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

在编译过程中，v-for 的优先级要高于 v-if，因此如果在同一个节点上同时使用了v-if 和 v-for，那么在循环生成每一条数据时都要对 v-if 进行判断，造成了没必要的性能消耗。可以通过把 v-if 绑定在 v-for 的上一级父节点上，或者在给循环列表的数据赋值前进行过滤。

### React Diff

在 react diff 中采用的策略是**遍历新的 children 过程中寻找过程中在旧 `children` 中所遇到的最大索引值**，如果后续寻找过程中发现索引值比最大索引值小的节点，则意味着该节点需要被移动。

移动的策略是，找到一个参考节点，将当前新 child 对应的 dom 插入到这个参考节点之前。这个参考节点是当前新 child 的上一个 child 的真实 dom 节点的下一个兄弟节点。

在新旧 children 遍历结束后，再遍历旧 children，对比新旧 children 中是否有需要移除的旧节点。

该 diff 算法的问题在于会有多余的 DOM 操作开销。

### Vue3 中的 Diff

+ 预处理阶段分别从前往后，从后往前筛选，去除相同的前缀和后缀节点（提前进行 patch ）。筛选完成之后如果新节点为空，则移除旧节点剩余节点；如果旧节点为空，新节点还有剩余，则新创建这些节点。
+ 预处理之后，需要判断哪些节点需要被移动、删除、创建
  + 首先维护一个数组，长度与**新节点列表中**未处理的节点数量相同，用于记录新列表的节点在旧列表中的位置。
  + 接着循环遍历旧节点列表，尝试在新的节点中找到 key 相同的节点，移除没有找到的节点，同时维护更新数组
  + 接着就是新增和移动的处理，**从尾到头**遍历数组，如果是新增，则新增节点，如果非新增，则表示需要被移动，这时候将其移动至对应的 index （插入到该节点在新节点中位置的下一个节点位置）之前。
  + 在遍历的过程中，存在不需要移动的节点，即在其他节点移动完成后，这些节点的顺序自然是正确的，因此还会根据数组还维护了一份最长递增子序列，用来标识不需要移动的节点。

总结：

在创建VNode时就确定其类型，以及在`mount/patch`的过程中采用`位运算`来判断一个VNode的类型，在这个基础之上再配合核心的Diff算法，使得性能上较Vue2.x有了提升。

该算法中还运用了`动态规划`的思想求解最长递归子序列。

### Vue 3 和 Vue 2 的 Diff 对比

+ 二者同时会先对头尾进行判断，Vue2是双指针的循环
+ 对于无序节点， Vue 3 会直接维护一个数组，标记节点是否需要移动或新增，在标记的过程中会过滤掉移除的点，相同的点直接patch。而 Vue 2 对于无序节点的判断放在了最后，仍然会执行完之前所有的判断。
+ Vue 3 通过维护最长递增子序列减少节点的移动操作

### Vue 3 优化点（待补充）

+ vnode

  + 增强了静态分析，为节点标记为静态节点与动态节点，在 patch 时，只会比较动态节点。（Vue 2 中 optimize 过程会标记静态节点掠过分析）
  + 节点类型细化区分。生成的 Vnode 会标记该节点的 patchFlag，标识哪些部分可能会有修改。 在 patch 节点有很多地方会根据这个标记作特定的操作。而在 Vue 2 中，普通节点的 patch 会通过内置的 update 钩子进行圈梁新旧比对然后更新；如果是 component，则会在 prepatch 节点进行判断，有变化触发 forceUpdate。显然在这个过程中会作较多重复无用的对比。

+ 事件优化（待补充）

  Vue 3 可以缓存事件，事件变化不会引起重新渲染。

  Vue 2 中则是每次更新后， vnode 绑定的事件都是一个全新生成的 function，即使其内部代码是一样的，由此出发 events 的 update 钩子

## 应用层

### 组件间通信 （方法，废弃的 dispatch 的实现）

+ vuex
+ event bus
+ pub / sub
+ emit / on
+ provide / inject
+ dispatch / broadcast
+ props
+ parent / children 实例对象

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

  由于在初始化时，根 Vue 实例的 `_route` 属性定义成响应式的。在 render 过程中，都会会访问父组件上的 $route 属性。最终触发这个属性的 getter，收集到了渲染 watcher。在执行完 transitionTo （路径切换）后，会修改这个响应式属性，触发了它的 setter，因此通知渲染 watcher 更新，重新执行了 router-view 组件的 render 渲染，在 render 中获取到当前路由对应的组件，调用 createElement 方法渲染。

+ router-link

   在 render 过程中，首先对路由进行解析，针对标签上特定的 class 做处理。通过监听点击事件（或其他 prop 传入的事件类型）执行函数方法，最终调用 router.push 或 router.replace 方法进行路由跳转。

#### 总结

在进行路由切换时，会把当前的线路切换到目标的线路，在切换过程中会执行一系列导航守卫钩子函数，并且更改 url，同时最后渲染对应的组件。切换完成后把目标的路由切换为当前路由，用作下一次路径切换的依据。

## 框架层 

### MVC/MVVM 的理解（待完善）

+ 传统组件需要维护更新 DOM ，Vue 等框架可以通过数据来驱动视图，使开发人员聚焦于数据层，不需要去在 DOM 过于复杂的情况下维护
+ View （DOM）、ViewModel（Vue 各种事件来改变 model ，从而驱动视图更新）、Model（JS Object）

### 框架解决了什么问题

### 与 React 的对比

+ [Vue3 究竟好在哪里？（和 React Hook 的详细对比）](https://juejin.im/post/6844904132109664264)
+ [为什么说 Vue 的响应式更新精确到组件级别？（原理深度解析）](https://juejin.im/post/6844904113432444942)

