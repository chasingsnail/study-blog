# patch

1. 实例下的 _vnode 属性就是对应每个组件下的实际渲染 root vnode（该 vnode 含一维数组 children 属性，递归构建成 vnode tree，其中对于组件将会采用占位符 vnode）。
2. 实例下的 $vnode 属性就对应每个组件在父组件中的占位符 vnode，因此对于根来说 $vnode 就是 null，占位符 vnode 的主要属性都在 componentOptions 下。
3. 实例下的 $parent 存储的是父组件 vm 实例
4. 实例下的 $children 存储的是所有子组件 vm 实例
5. 渲染 vnode 下的 parent 属性对应的是该组件在父组件中的占位符 vnode

# 生命周期

beforeCreated、beforeMount、created 生命周期是先父后子。

## mouted

在整个 patch 过程中，会有一个数组一直搜集当前的组件vnode，并且触发其 mounted 钩子，由于 patch 的过程是深度递归遍历的形式，因此，会收集到子组件的 vnode，因此 mounted 调用的顺序是先子后父。



## 总结

父beforeCreate->父created->父beforeMount->子beforeCreate->子created->子beforeMount->子mounted->父mounted



