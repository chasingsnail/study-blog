## 背景

表单可以说是前端开发中最经常遇到的元素之一。在日常表单的开发中，存在着 `v-if` 条件渲染、满屏 `magic number` 枚举值，再加上表单之间的复杂的联动交互的情况，往往使得一个看似简单的表单变得愈加臃肿不堪。

表单的联动关系与状态重置往往散落在各个函数方法中，随着需求的不断扩充与变更，使得表单之间的耦合复杂度上升，对于后续的开发者而言，很难清晰快速地了解表单中隐含的业务逻辑与联动关系，这使得表单变得非常不便于维护。

## 配置表单构建

在业务开发中，使用表单最终的目的在于提交特定格式的数据。那是否有办法通过配置某种数据结构，来清晰地表达各个表单项的参数、控件类型与联动关系呢？

### 通过JSON来配置表单

我们从配置二字入手，将表单的开发看作是配置一些 `key` 与 `value` 的映射，理想情况下，我们希望能够用一个 `JSON` 的结构来定义表单模型。

```json
[
  {
    label: '表单项1',
    key: 'item1',
    type: 'input'
  },
  {
    label: '表单项2',
    key: 'item2',
    type: 'select',
    props: {
      options: []
    }
  }
]
```

通过上述的配置结构，期望能够在页面中生成对应的表单模板：


![](https://user-gold-cdn.xitu.io/2019/11/8/16e4a560b73891f0?w=624&h=133&f=png&s=5401)

在上述配置中，`label` 表示表单标签，`type` 表示表单对应的控件类型，`key` 表示表单中的数据参数。最终，根据用户的输入，我们最终可以获取到以下数据模型用以提交：

```json
{
  item1: '',
  item2: ''
}
```

明确了表单的配置结构后，我们可以开始着手去构建一个表单组件，这个组件仅需要传入 `JSON` 配置。

```vue
<template>
  <div>
    <ConfigForm :formModel="formModel" :formItems="formItems" />
  </div>
</template>

<script>
export default {
  data() {
    return {
      formModel: {
        item1: ''
      },
      formItems: [
        {
          label: '标签1',
          key: 'item1',
          type: 'input'
        }
      ]
    }
  }
}
```

其中，`formModel` 是我们最后提交所需要的数据参数，而 `formItems` 对应的每一项是一个表单控件。

### 组件映射

首先，我们可以选择自己喜欢的组件库来作为表单组件的基础模板，这里选择使用 `Element-UI` 中的 `Form` 及其相关控件组件作为基础。

在我们的 `JSON` 配置中，`type` 字段用来表示不同的表单控件。因此我们需要维护一份 `type` 与组件 `tag` 之间的映射关系：

```js
const tagMap = {
  input: {
    tag: 'el-input',
    props: {
      clearable: true
    }
  },
  select: {
    tag: 'el-select'
  }
  // ...
}
```

如上代码所示，定义了一个`type`与组件间的映射关系，例如`type`为`input`时，对应渲染的是`Element`中的`el-input`组件。另外我们还可以在`props`中额外配置了各组件初始化属性。

有了组件的映射关系之后，下一步要做的是通过`v-for`循环渲染表单中的各个组件，由于表单控件类型的不确定性，我们需要使用`Vue`中动态组件 `<component>` 。

```vue
<el-form-item
  v-for="item in configItems"
  :label="item.label"
  :key="item.key"
>
  <component
    :is="item.tag"
    v-model="formModel[item.key]"
    v-bind="item.props"
  ></component>
</el-form-item>
```

如上代码所示，这里的 `configItems` 是由我们传入的 `JSON` 配置处理而来。

```js
computed: {
  configItems() {
    return this.formItems.map(item => formatItem(item, this.formModel)
  }
}
```

我们将 `configItems` 的转化工作放在计算属性中进行，这么做的原因是能够触发 `formModel` 收集到 `configItems` 的依赖，使得在 `formModel` 变化时，表单能够做出正确的响应渲染。

这里的核心在于 `formatItem` 方法，它是表单项转化的关键所在。

```js
function formatItem(config, form) {
  let item = { ...config }
  const type = item.type || 'input'
  const comp = tagMap[type]
  // 映射标签
  item.tag = comp.tag
  // 维护props
  item.props = { ...comp.props, ...item.props }
  return item
}
```

这里还有一个问题，当我们遇到`el-select`这样本身是嵌套的组件时，还需要考虑下拉框`el-option`的渲染。这种情况下需要针对下拉框组件额外封装一个自定义组件，例如：

```vue
<form-select :options=""></form-select>
```

如上，我们需要在`JSON`配置中的props对象中设置options字段来保证选项值的传入。

由此我们可以初步构建了配置型表单组件的雏形，可以通过配置`type`与`key`，完成对应的组件映射渲染与数据绑定，并通过props字段额外传入组件原本的属性或自定义组件需要的参数。

## 表单间的联动

到这里我们只是简单的完成了表单控件按类型渲染的能力，在实际的开发中，表单往往存在各个项之间的联动关系，因此我们还需要根据表单项之间的联动来继续扩展表单的能力。

### 条件渲染

即当某个表单项为一个特定值时，其他一个或多个表单项不显示（或显示）。

我们通过在配置项中增加`ifShow`字段来控制表单项的展示与否。由于表单项的展示是根据另一个表单项的值的动态变化来决定的，因此我们需要将`ifShow`设置为一个函数，并且将`formModel`作为参数传入。

```json
[
  {
    label: '标签1',
    key: 'item1'
  },
  {
    label: '标签2',
    key: 'item2',
    ifShow(form) {
      return form.item1 !== 1
    }
  }
]
```

如上代码所示，当`item1`的值不为1时，`item2`才会展示。对应需要修改`formatItem`方法：

```js
item._ifShow = isFunction(item.ifShow) ? item.ifShow(form) : true
```

对应需要在el-form-item的`v-if`中传入`item._ifShow`。

### 动态范围限定

某些场景下，当表单项1为特定值时，表单项2仅能选择固定范围内的值。

```json
[
  {
    label: '标签1',
    key: 'item1',
    type: 'radio',
    props: [
      { 1: 'radio1', 2: 'radio2'}
    ]
  },
  {
    label: '标签2',
    key: 'item2',
    type: 'select',
    ifShow(form) {
      return form.item1 === '1'
    },
    props(form) {
      let options = []
      if (form.item1 === 1) {
        options = { 1: 'select1', 2: 'select2'}
      } else {
        options = { 3: 'select3', 4: 'select4' }
      }
      return {
        options
      }
    }
  }
]
```

相应的，在`formatItem`方法中，要判断props的类型，如果是函数的情况下，传入`formModel`。

```js
const _props = isFunction(item.props) ? item.props(form) : item.props
item.props = { ...comp.props, ..._props }
```

总结上述存在的情况，最终我们的组件模板与`formatItem`方法调整为：

```vue
<el-form-item
  v-for="item in configItems"
  v-if="item._ifShow"
  :label="item.label"
  :key="item.key"
>
  <component
    :is="item.tag"
    v-model="formModel[item.key]"
    v-bind="item.props"
  ></component>
</el-form-item>
```

```js
function isFunction(fn) {
  return typeof fn === 'function'
}
function formatItem(config, form) {
  let item = { ...config }
  const type = item.type || 'input'
  let comp = tagMap[type]
  // 映射标签
  item.tag = comp.tag
  // 维护props
  const _props = isFunction(item.props) ? item.props(form) : item.props
  item.props = { ...comp.props, ..._props }
  // 是否显示
  item._ifShow = isFunction(item.ifShow) ? item.ifShow(form) : true
  return item
}
```

## 表单功能扩展

目前为止，我们的表单组件已经具备了按需渲染不同类型控件与表单项之间简单的联动处理。在实际开发工作中，我们还需要在表单的基础上进行异步数据请求、调用控件组件自身方法等等需求。因此，我们还需要继续扩展表单的功能。

### 组件属性与方法传递

在`Element`中，表单相关的组件例如`Select`通常带有自身的`Event API`。而目前我们使用的动态组件无法很好地作到将`API`透传。

这里使用了高阶组件的思想，结合`Vue`渲染函数`render`方法来实现目的。具体可以参考文档中[渲染函数 & JSX]( https://cn.vuejs.org/v2/guide/render-function.html )章节。

在使用`render`函数返回组件之前，我们先来简单熟悉一下`createElement`方法的参数，如官方文档所示：

```js
// @returns {VNode}
createElement(
  // {String | Object | Function}
  // 一个 HTML 标签名、组件选项对象，或者
  // resolve 了上述任何一种的一个 async 函数。必填项。
  'div',

  // {Object}
  // 一个与模板中属性对应的数据对象。可选。
  {
    // (详情见下一节)
  }
  // 省略...
)
```

我们主要用到的是前两个参数。

其中，第一个参数即是我们需要渲染组件，这里可以传入一个`String`，对应到我们`JSON`配置中，便是上文中提到的`type`到组件`tag`的映射，因此我们这个地方传入`item.tag`即可。

第二个参数是一个对象，按官网描述如下：

```js
{
  // 普通的 HTML 特性
  attrs: {
    id: 'foo'
  },
  // 组件 prop
  props: {
    myProp: 'bar'
  },
  // 事件监听器在 `on` 属性内，
  // 但不再支持如 `v-on:keyup.enter` 这样的修饰器。
  // 需要在处理函数中手动检查 keyCode。
  on: {
    click: this.clickHandler
  }
  // 省略...
}
```

从这里我们可以看出，需要透传的`Event API`可以合并置于对象的`on`字段中。

在之前的表单设计中，我们将组件的`attr`属性也放在`props`字段中，这里为了方便观察，我们将配置调整为与该对象参数保持一致。我们在配置中将属性、方法与自定义组件`prop`进行拆分，分别为`attrs`、`on`与`props`字段，其中`attrs`与`props`可以设计为**函数或对象**的形式，方便某些属性需要根据其它表单项的值变化。

例如，我们需要一个可搜索，并且可监听值变化的`Select`表单项，可以进行如下配置：

```json
{
  label: '标签2',
  key: 'item2',
  type: 'select',
  attrs: {
    filterable: true
  },
  on: {
    change: this.handleChange
  },
  props: {
    options: {
      1: 'select1',
      2: 'select2'
    }
  }
}
```

那么，了解了render函数的使用后，我们可以尝试构建出一个高阶组件来替换动态组件：

`DynamicCell.vue`

```vue
<script>
export default {
  props: {
    item: Object
  },
  render(h) {
    const { item } = this
    const WrapComp = item.tag
    return h(WrapComp, {
      on: this.$listeners,
      attrs: { ...this.$attrs, ...item.attrs },
      props: this.$props
    })
  }
}
</script>

```

在我们的表单模板中，也需要稍微做一些修改：

```vue
<el-form-item
  v-for="item in configItems"
  v-if="item._ifShow"
  :label="item.label"
  :key="item.key"
>
  <hoc
    v-model="formModel[item.key]"
    :item="item"
  ></hoc>
</el-form-item>
```

同样地，我们需要调整`formatItem`方法：

```js
// 维护props
const _props = isFunction(item.props) ? item.props(form) : item.props
item.props = _props
// attrs
const _attrs = isFunction(item.attrs) ? item.attrs(form) : item.attrs
item.attrs = Object.assign({}, comp.attrs || {}, _attrs)
```

### 异步取值

在某些业务场景下，表单中Select下拉框选项需要调用接口去异步获取。同时，这一份数据可能会在页面中多个不同的表单中使用到，因此需要将获取到的数据保存在`Vue`的`data`中，假设变量名为`tempOpts`，那么我们的`JSON`配置为：

```json
{
  label: '标签2',
  key: 'item2',
  type: 'select',
  props: () => {
    return {
      options: this.tempOpts
    }
    
  }
```

这里需要将`props`字段写成箭头函数的形式。如果是对象的形式，data 执行初始化时，tempOpts 属性还未挂载到实例（this）上，因此是 undefined。当 props 函数在 computed 中执行时，此时 data 的初始化已经完成。同样地，我们需要调整`formatItem`方法：

```js
// 维护 props
const _props = item.props
  ? isFunction(item.props)
    ? item.props(form)
    : item.props
  : {}
```



### 自定义组件

表单中除了渲染`Element`提供的表单控件外，某些页面的表单存在非常规表单元素，而这类特定页面出现的组件无需设置为全局组件，因此，需要提供自定义组件渲染的能力。

这时同样需要用到render函数的能力：我们可以在定义的  DynamicCell 组件中使用`JSX`语法，并通过`render`方法渲染模板。

我们可以在`JSON`配置中增加`renderCell`字段，假设当前有一个自定义组件<button-counter>：

```json
{
  label: '标签1',
  key: 'item1',
  renderCell: () => {
    return <button-counter prop1={this.prop1} />
  }
}
```

同样地，在 DynamicCell 中要进行针对`renderCell`的判断：

```js
render(h) {
  const { item } = this
  const WrapComp = item.tag
  if (item.renderCell) {
    return item.renderCell
  } else {
    return h(WrapComp, {
      on: this.$listeners,
      attrs: { ...this.$attrs, ...item.attrs },
      props: this.$props
    })
  }
```

### 表单验证

表单验证功能同样也是表单不可或缺的功能之一。我们直接可以使用`el-form-item`组件中的`rules`属性，并在`JSON`配置中传入`rules`字段赋值给该属性。

## 小结

通过以上的一系列调整，最终我们的表单组件具备了按需渲染控件、透传`API`、渲染自定义组件、表单验证等等。在日常项目开发中，基本能够满足需求。

最终我们呈现在`template`中的，仅仅是一行：

```vue
<ConfigForm :formModel="formModel" :formItems="formItems" />
```

对于开发者而言，只需要写好`JSON`配置，便可以将表单间的联动耦合关系集中体现在配置中，让后续的维护变得清晰容易。

如有缺陷，欢迎批评指正。

### 参考

+ [再也不想写表单了]( https://zhuanlan.zhihu.com/p/48241645 )
+ [ 探索Vue高阶组件]( http://caibaojian.com/vue-design/more/vue-hoc.html )
+ [渲染函数 & JXS](