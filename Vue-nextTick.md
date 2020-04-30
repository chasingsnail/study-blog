## 异步队列更新

首先我们观察一段代码：

```html
<template>
  <div>
    <div>{{number}}</div>
  </div>
</template>
```

```js
export default {
  data() {
    return {
      number: 0
    }
  },
  mounted() {
    let total = 100
    while(total--) {
      this.number++
    }
  }
}
```

在`mounted`阶段中，number的值被重复多次累加。那么在拦截器函数setter被触发了100次后，DOM的更新是否也渲染了100次呢？答案是否定的。

当我们在组件中对响应数据做出了修改时，会触发拦截器的`setter`方法，调用`Dep`实例方法`notify`通知更新。

```js
class Dep {
  // 省略...
  notify () {
  // stabilize the subscriber list first
    const subs = this.subs.slice()
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update()
    }
  }
}
```

### 缓存Watcher队列

在update方法中，针对computed与sync状态分别作了判断。

```js
update () {
  /* istanbul ignore else */
  if (this.computed) {
    // 省略...
  } else if (this.sync) {
    this.run()
  } else {
    queueWatcher(this)
  }
}
```

在一般组件数据更新时，会走到最后一个`queueWatcher(this)`方法。

```js
export function queueWatcher (watcher: Watcher) {
  const id = watcher.id
  if (has[id] == null) {
    has[id] = true
    if (!flushing) {
      queue.push(watcher)
    } else {
      // if already flushing, splice the watcher based on its id
      // if already past its id, it will be run next immediately.
      let i = queue.length - 1
      while (i > index && queue[i].id > watcher.id) {
        i--
      }
      queue.splice(i + 1, 0, watcher)
    }
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

`flushing`变量用于判断当前是否在执行更新，如果没有，则将观察者添加到队列尾部；如果有，则会按某种顺序添加，这种情况存在于**计算属性**中，当触发了计算属性的`get`时，会将观察者添加入队列中，这时候就走到了`else`判断。

这里`Vue`引入了队列的概念，这是针对通知更新的优化，`Vue`不会把每次数据的改变都触发回调，而是把这些Watcher先添加到一个队列里，然后在`nextTick`后执行`flushSchedulerQueue`。

### 渲染时机

我们知道任务队列分为`macro-task`和`micro-task`。在`macro-task`中两个不同任务之间会穿插`UI`的重新渲染，需要在`micro-task`中把所有`UI`渲染之前需要更新的数据更新，就可以保证一次渲染得到最新的`DOM`。

优选的选择是用`micro-task`去更新数据，因此最优解是`Promise`，如果不支持`Promise`，则会降级为`macro-task`，例如选用`setTimeout`等。综上，`nextTick`方法实际上是在做一个最优选择，优先去检测是否支持`Promise`，否则降级至`macro-task`中渲染。

```js
if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
  macroTimerFunc = () => {
    setImmediate(flushCallbacks)
  }
} else if (typeof MessageChannel !== 'undefined' && (
  isNative(MessageChannel) ||
  // PhantomJS
  MessageChannel.toString() === '[object MessageChannelConstructor]'
)) {
  const channel = new MessageChannel()
  const port = channel.port2
  channel.port1.onmessage = flushCallbacks
  macroTimerFunc = () => {
    port.postMessage(1)
  }
} else {
  /* istanbul ignore next */
  macroTimerFunc = () => {
    setTimeout(flushCallbacks, 0)
  }
}
if (typeof Promise !== 'undefined' && isNative(Promise)) {
  const p = Promise.resolve()
  microTimerFunc = () => {
    p.then(flushCallbacks)
    // in problematic UIWebViews, Promise.then doesn't completely break, but
    // it can get stuck in a weird state where callbacks are pushed into the
    // microtask queue but the queue isn't being flushed, until the browser
    // needs to do some other work, e.g. handle a timer. Therefore we can
    // "force" the microtask queue to be flushed by adding an empty timer.
    if (isIOS) setTimeout(noop)
  }
} else {
  // fallback to macro
  microTimerFunc = macroTimerFunc
}
```

代码中首先定义变量 `microTimerFunc` 。如果支持`Promise`，则通过定义返回值为立即`resolve`的`Promise`对象，将`flushCallbacks`注册为`micro-task`。

降级的处理是注册`macro-task`，将其赋值给`microTimerFunc`。`macroTimerFunc`是将`flushCallbacks`注册为`macro-task`。优先考虑`setImmediate`，接着是`MessageChannel` ，`setTimeout`为最后的备选。`setImmediate`的优势在于不需要不停地做超时检测，缺点是只有IE支持。对于`MessageChannel` ，它的实现在于使用另一个`port`向前一个`port`发送消息时，前一个`port`的`onmessage`回调就会注册为`macro-task`。

### nextTick具体实现

```js
export function nextTick (cb?: Function, ctx?: Object) {
  let _resolve
  callbacks.push(() => {
    if (cb) {
      try {
        cb.call(ctx)
      } catch (e) {
        handleError(e, ctx, 'nextTick')
      }
    } else if (_resolve) {
      _resolve(ctx)
    }
  })
  // 省略...
}
```

这里将`cb`添加至`callbacks`数组中，被添加到数组的函数执行时会调用`cb`回调。

```js
export function nextTick (cb?: Function, ctx?: Object) {
  // 省略...
  if (!pending) {
    pending = true
    if (useMacroTask) {
      macroTimerFunc()
    } else {
      microTimerFunc()
    }
  }
  // 省略...
}
```

定义了`pending`表示判断是否在等待刷新。触发刷新就需要执行后续的`macroTimerFunc`或`microTimerFunc`方法。而无论哪种任务类型，都需要等待调用栈清空之后。

```js
created () {
  this.$nextTick(() => { console.log(1) })
  this.$nextTick(() => { console.log(2) })
  this.$nextTick(() => { console.log(3) })
}
```

上述例子中，由于调用了三次`nextTick`方法，只有第一次调用的时候会执行`microTimerFunc`将 `flushCallbacks`  注册为`micro-task`。这时候不会立即执行而是需要等待调用栈清空，也就是后两次`nextTick`执行之后才会执行。而那个时候，`callbacks`队列中已经包含了所有本次循环注册的回调，接下来就是在`flushCallbacks`  执行回调并清空。

```js
function flushCallbacks () {
  pending = false
  const copies = callbacks.slice(0)
  callbacks.length = 0
  for (let i = 0; i < copies.length; i++) {
    copies[i]()
  }
}
```

这里是使用了`copies`常量来保存了一份callbacks的赋值，接着去遍历执行，而在遍历`copies`之前就已经将callbacks数组清空。这么做的原因是为了防止在遍历执行回调的过程中，不断有新的回调添加到 callbacks 数组中的情况发生 。

在实际开发中，获取到从服务端的数据后，如果数据做了修改而我们又需要依赖更改后后的`DOM`，这时候就必须在`nextTick`后执行。

## 计算属性computed的实现

 计算属性的初始化是发生在 `Vue` 实例初始化阶段的 `initState` 函数中，执行了 `if (opts.computed) initComputed(vm, opts.computed)` 。

```js
const computedWatcherOptions = { lazy: true }

function initComputed (vm: Component, computed: Object) {
  // $flow-disable-line
  const watchers = vm._computedWatchers = Object.create(null)
  // computed properties are just getters during SSR
  const isSSR = isServerRendering()

  for (const key in computed) {
    const userDef = computed[key]
    const getter = typeof userDef === 'function' ? userDef : userDef.get
    if (process.env.NODE_ENV !== 'production' && getter == null) {
      warn(
        `Getter is missing for computed property "${key}".`,
        vm
      )
    }

    if (!isSSR) {
      // create internal watcher for the computed property.
      watchers[key] = new Watcher(
        vm,
        getter || noop,
        noop,
        computedWatcherOptions
      )
    }

    // component-defined computed properties are already defined on the
    // component prototype. We only need to define computed properties defined
    // at instantiation here.
    if (!(key in vm)) {
      defineComputed(vm, key, userDef)
    } else if (process.env.NODE_ENV !== 'production') {
      if (key in vm.$data) {
        warn(`The computed property "${key}" is already defined in data.`, vm)
      } else if (vm.$options.props && key in vm.$options.props) {
        warn(`The computed property "${key}" is already defined as a prop.`, vm)
      }
    }
  }
}
```

在对 `computed` 对象做遍历之后，拿到计算属性的每一个 `userDef`，然后获取这个 `userDef` 对应的 `getter` 函数， 也就是说计算属性观察者的求值对象是 `getter` 函数。接下来为每一个 `getter` 创建一个 `watcher`。

```js
export function defineComputed (
  target: any,
  key: string,
  userDef: Object | Function
) {
  const shouldCache = !isServerRendering()
  if (typeof userDef === 'function') {
    sharedPropertyDefinition.get = shouldCache
      ? createComputedGetter(key)
      : userDef
    sharedPropertyDefinition.set = noop
  } else {
    sharedPropertyDefinition.get = userDef.get
      ? shouldCache && userDef.cache !== false
        ? createComputedGetter(key)
        : userDef.get
      : noop
    sharedPropertyDefinition.set = userDef.set
      ? userDef.set
      : noop
  }
  if (process.env.NODE_ENV !== 'production' &&
      sharedPropertyDefinition.set === noop) {
    sharedPropertyDefinition.set = function () {
      warn(
        `Computed property "${key}" was assigned to but it has no setter.`,
        this
      )
    }
  }
  Object.defineProperty(target, key, sharedPropertyDefinition)
}
```

在这个函数中，利用了 `Object.defineProperty` 给计算属性添加了`getter`与`setter`。其`getter`函数为：

```js
sharedPropertyDefinition.get = function computedGetter () {
  const watcher = this._computedWatchers && this._computedWatchers[key]
  if (watcher) {
    watcher.depend()
    return watcher.evaluate()
  }
}
```

在调用时，首先定义了`watcher`常量，其值为计算属性的观察对象。若该对象存在，则会执行`depend`方法与`evaluate`方法。

首先depend方法的执行，会触发收集依赖，这时候的`Dep.target`是渲染函数的依赖（观察者）。`evaluate`方法中会触发`this.get()`方法，那么实际上是触发了Watcher的第二个参数getter。

```js
computed: {
  calcA () {
    return this.a + 1
  }
}
```

在上述的例子中，`getter`实际上就是对于如上函数的求值。同时这个求值的过程会触发属性`a`的`get`拦截器函数，这会导致`a`收集到一个依赖，这个依赖便是计算属性的依赖，而实际上是渲染函数的依赖。

而当我们修改`a`的值时，会触发`a`所收集到的所有依赖，其中便是包含了计算属性的观察者。

综上总结，在定义计算属性时，实际上实例化`watcher`对象。当在模板中使用了计算属性后，会触发计算属性的`get`拦截器，调用了相关方法去收集依赖，这个过程中计算属性收集的实际上是渲染函数的依赖（观察者）。在收集完依赖后会对其进行求值，这个求值的过程实际上会触发计算属性依赖的响应式数据对象的`get`拦截器，导致了这个数据对象属性收集到一个计算属性的观察者，实际上是收集到了渲染函数的观察者。那么当该数据对象改变的时候，则会触发它所收集的所有依赖，其中就包含了计算属性的观察者，由此完成了相应的更新。

## 侦听属性watch选项的实现

侦听属性的初始化也是发生在 `Vue` 实例初始化阶段的 `initState` 函数中：

```js
if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch)
  }
// ...
function initWatch (vm: Component, watch: Object) {
  for (const key in watch) {
    const handler = watch[key]
    if (Array.isArray(handler)) {
      for (let i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i])
      }
    } else {
      createWatcher(vm, key, handler)
    }
  }
}
function createWatcher (
  vm: Component,
  expOrFn: string | Function,
  handler: any,
  options?: Object
) {
  if (isPlainObject(handler)) {
    options = handler
    handler = handler.handler
  }
  if (typeof handler === 'string') {
    handler = vm[handler]
  }
  return vm.$watch(expOrFn, handler, options)
}
```

在对传入的`watch`进行了相关的类型判断后，执行`createWatcher`方法，这个方法最后调用的是`$watch`逻辑。

### $watch

```js
Vue.prototype.$watch = function (
  expOrFn: string | Function,
  cb: any,
  options?: Object
): Function {
  const vm: Component = this
  if (isPlainObject(cb)) {
    return createWatcher(vm, expOrFn, cb, options)
  }
  options = options || {}
  options.user = true
  const watcher = new Watcher(vm, expOrFn, cb, options)
  if (options.immediate) {
    cb.call(vm, watcher.value)
  }
  return function unwatchFn () {
    watcher.teardown()
  }
}
```

该方法本质上是创建了一个`Watcher`实例对象。一旦数据发生变化，便会执行`Watcher`实例方法`run`，调用函数`cb`，如果我们设置了`immediate`为`true`，则会立刻调用一次`cb`。最后返回了移除这个`watcher`的方法。

### 深度观测

我们首先来看Watcher中的get方法：

```js
get () {
    pushTarget(this)
    let value
    const vm = this.vm
    try {
      value = this.getter.call(vm, vm)
    } catch (e) {
      if (this.user) {
        handleError(e, vm, `getter for watcher "${this.expression}"`)
      } else {
        throw e
      }
    } finally {
      // "touch" every property so they are all tracked as
      // dependencies for deep watching
      if (this.deep) {
        traverse(value)
      }
      popTarget()
      this.cleanupDeps()
    }
    return value
  }
```

当我们将侦听属性的deep设置为true时，就会执行`traverse(value)`的逻辑。

```js
export function traverse (val: any) {
  _traverse(val, seenObjects)
  seenObjects.clear()
}

function _traverse (val: any, seen: SimpleSet) {
  let i, keys
  const isA = Array.isArray(val)
  if ((!isA && !isObject(val)) || Object.isFrozen(val) || val instanceof VNode) {
    return
  }
  if (val.__ob__) {
    const depId = val.__ob__.dep.id
    if (seen.has(depId)) {
      return
    }
    seen.add(depId)
  }
  if (isA) {
    i = val.length
    while (i--) _traverse(val[i], seen)
  } else {
    keys = Object.keys(val)
    i = keys.length
    while (i--) _traverse(val[keys[i]], seen)
  }
}

```

其中针对`val.__ob__`的判断是防止数据循环引用导致的死循环问题。在执行` _traverse(val[i], seen)`时，传入了val[i]，触发了子属性的get拦截，由此收集到了依赖。

总的来说，侦听属性也是基于`Watcher`的一种实现。