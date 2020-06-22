# Patch

## createElm

该方法通过虚拟节点创建真实的 DOM 并插入到它的父节点中。

```js
// patch
function patch (oldVnode, vnode, hydrating, removeOnly) {
  // oldVnode: vm.$el 可视为占位符
  
  //...
  
   // create new node
   createElm(
     vnode,
     insertedVnodeQueue,
     // extremely rare edge case: do not insert if old element is in a
     // leaving transition. Only happens when combining transition +
     // keep-alive + HOCs. (#4590)
     oldElm._leaveCb ? null : parentElm,
     nodeOps.nextSibling(oldElm)
   )
}

// createElm
function createElm (
  vnode,
  insertedVnodeQueue,
  parentElm,
  refElm,
  nested,
  ownerArray,
  index
) {
	// ...
  const data = vnode.data
  const children = vnode.children
  const tag = vnode.tag
  if (isDef(tag)) { // 普通标签节点
		// ...
    
    // 创建占位符元素
    vnode.elm = vnode.ns
      ? nodeOps.createElementNS(vnode.ns, tag)
      : nodeOps.createElement(tag, vnode)
    setScope(vnode)

    /* istanbul ignore if */
    if (__WEEX__) {
      // ...
    } else {
      createChildren(vnode, children, insertedVnodeQueue) // 深度遍历递归 child
      if (isDef(data)) {
        invokeCreateHooks(vnode, insertedVnodeQueue)
      }
      insert(parentElm, vnode.elm, refElm) // 插入 parentElm
    }

    if (process.env.NODE_ENV !== 'production' && data && data.pre) {
      creatingElmInVPre--
    }
  } else if (isTrue(vnode.isComment)) { // 注释节点
    vnode.elm = nodeOps.createComment(vnode.text)
    insert(parentElm, vnode.elm, refElm)
  } else { // 纯文本节点
    vnode.elm = nodeOps.createTextNode(vnode.text)
    insert(parentElm, vnode.elm, refElm)
  }
}
```

## 组件patch过程

1. createElm
2. 组件 vnode 执行 createComponent 方法
   1. 执行 vnode.data.hook ( createComponent 中合并了hook) 

# 响应式

## 依赖收集

在 initData 方法中，执行了 `observe(data, true)`方法，该方法返回一个 Observer 实例。

Observer 构造函数中，先给整个实例添加给了data的 `__ob__`属性。接着 循环遍历了 data 对象的每个属性，分别调用了 `defineReactive(obj, keys[i])`。

当我们对数据对象进行观测时，假设有如下对象：

```js
// before
const data = {
  a: {
    b: 1
  }
}

// after 
const data = {
  a: {
    b: 1,
    __ob__: {value, dep, vmCount}
  },
  __ob__: {value, dep, vmCount}
}
```

在`defineReactive`中，调用了 Object.defineProperty API 给每个 data 的属性添加了 getter 和 setter

```js
Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      const value = getter ? getter.call(obj) : val
      if (Dep.target) {
        dep.depend()
        if (childOb) {
          childOb.dep.depend()
          if (Array.isArray(value)) {
            dependArray(value)
          }
        }
      }
      return value
    }
  // ...
}
```

当获取 data 属性的值时，会触发getter方法，执行 `dep.depend()`将自身`watcher`添加进订阅管理 subs 中，由此收集到了该属性的依赖。

当在执行 mount 阶段时，会执行一下函数。

```js
updateComponent = () => {
  vm._update(vm._render(), hydrating)
}
new Watcher(vm, updateComponent, noop, {
  before () {
    if (vm._isMounted) {
      callHook(vm, 'beforeUpdate')
    }
  }
}, true /* isRenderWatcher */)
```

当我们实例化一个watcher时，在watcher内部的构造函数逻辑中，会执行`pushTarget(this)`。

```js
export default class Watcher {
  constructor (
    vm: Component,
    expOrFn: string | Function,
    cb: Function,
    options?: ?Object,
    isRenderWatcher?: boolean
  ) {
    this.vm = vm
		// ...
    if (typeof expOrFn === 'function') {
      this.getter = expOrFn
    } else {
      this.getter = parsePath(expOrFn)
      if (!this.getter) {
        this.getter = function () {}
        process.env.NODE_ENV !== 'production' && warn(
          `Failed watching path: "${expOrFn}" ` +
          'Watcher only accepts simple dot-delimited paths. ' +
          'For full control, use a function instead.',
          vm
        )
      }
    }
    if (this.computed) {
      this.value = undefined
      this.dep = new Dep()
    } else {
      this.value = this.get()
    }
  }
  
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
}
```

这样就是将Dep.target 赋值为当前渲染watcher，接着调用了 `value = this.getter.call(vm, vm)`。

这里的 getter 即是实例化watcher的第二个参数，即`updateComponent`，而在该函数内，生成VNode的过程中，会对vm上的数据进行访问，这时候就出发了数据对象的getter，由此收集到了相关依赖。

```js
const data = {
  a: {
    b: 1,
    __ob__: {value, dep, vmCount}
  },
  __ob__: {value, dep, vmCount}
}
```

在这个例子中，a 通过闭包引用的 childOb，实际上是 `data.a.__ob__`，因此在执行 `childObj.dep.depend()`时，除了会将依赖收集到 a 自己的 dep 中，还会收集到 childObj 的 dep 中，后者的触发时机时在通过 Vue.set API 给数据对象添加新属性时触发的，可以简单理解为：

```js
Vue.set = function (obj, key, val) {
  defineReactive(obj, key, val)
  const ob = obj.__ob__
  ob.dep.notify()
}
```

因此，`__ob__` 属性主要是用于添加、删除属性时能够触发依赖。

另外在get()方法中，还会执行 `traverse`方法，这是为了递归调用value所有的子项getter。接着最后是清空依赖。

在添加依赖的时候已经通过 id 去重避免了重复订阅，Vue还同时做了移除订阅的原因在于，假设有通过 v-if 条件渲染不同的模板，在切换模板渲染时，如果不清除上一个显示的模板的订阅，则依然触发这些订阅的回调，产生浪费。