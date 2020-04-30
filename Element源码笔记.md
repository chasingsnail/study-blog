### Button

`Button`源码较为简单，操作较少。主要在外观上`CSS`的书写上区分。

`button-group`通过`slot`承载`button`子组件。利用子`button`白色边框来控制显示间隔（同时搭配`margin: -1px`）。

```scss
@each $type in (primary, success, warning, danger, info) {
    .el-button--#{$type} {
      &:first-child {
        border-right-color: rgba($--color-white, 0.5);
      }
      &:last-child {
        border-left-color: rgba($--color-white, 0.5);
      }
      &:not(:first-child):not(:last-child) {
        border-left-color: rgba($--color-white, 0.5);
        border-right-color: rgba($--color-white, 0.5);
      }
    }
  }
```



### Radio

#### 结构

Radio组件没有使用常规的radio实现方法，而是通过标签模拟了radio样式。源码结构大致如下：

```vue
<label>
    <span class='el-radio__input'>
        <span class='el-radio__inner'></span>
        <input type='radio' />
    </span>
    <span class='el-radio__label'>
        <slot></slot>
        <template v-if="!$slots.default">{{label}}</template>
    </span>
</label>

```

实际上整个组件是一个外层label标签嵌套了两个`span`标签。

其中第一个`span`标签中看到了常规实现`radio`的`input`标签，实际上该input通过`css`设置了`opacity: 0`隐藏与绝对定位脱离文档流。而其中的`el-radio__inner`正是用于模拟圆圈的实现。

第二个`span`用于显示表单标签文字部分。如果slot为空，则默认显示`label`作为文字显示内容。

最外层的`label`起到的是扩大点击范围的作用。 在 `label` 元素内点击文本，就会触发此控件。就是说，当用户选择该标签时，浏览器就会自动将焦点转到和标签相关的表单控件上。 

#### 对比原生`radio`与`Vue`单选

原生单选中，实现一组单选项内的互斥是通过name属性来实现的：

```html
<input type="radio" name="sex" value="male" checked>男</input>
<input type="radio" name="sex" value="female">女</input>
```

checked属性表示被选中。

而在`Vue`的选中方式的实现在于通过v-model，即与name的值无关：

```html
<input type="radio" name="sex1" value="male" checked>男</input>
<input type="radio" name="sex2" value="female">女</input>
```

`vue`源码中针对了原生`radio`做了处理：

```js
function genRadioModel (
  el,
  value,
  modifiers
) {
  var number = modifiers && modifiers.number;
  var valueBinding = getBindingAttr(el, 'value') || 'null';
  valueBinding = number ? ("_n(" + valueBinding + ")") : valueBinding;
  addProp(el, 'checked', ("_q(" + value + "," + valueBinding + ")"));
  addHandler(el, 'change', genAssignmentCode(value, valueBinding), null, true);
}
```

参数传入的value就是input中value的值，而其中`valueBinding`的值是`v-model`中绑定的value。`addProp`方法中，checked属性的值为_`q(" + value + "," + valueBinding + ")"`。`__q`为浅比较方法，即 `==`。当`v-model`的值与input中value的值相同，则checked属性为true。由此达到互斥的效果。

而Element-UI中el-radio属性的实现略有不同，因为其通过css隐藏了input标签。

```vue
<span class="el-radio__input"
      :class="{
        'is-disabled': isDisabled,
        'is-checked': model === label
      }"
    >
      <span class="el-radio__inner"></span>
      <input
        ref="radio"
        class="el-radio__original"
        :value="label"
        type="radio"
        aria-hidden="true"
        v-model="model"
        @focus="focus = true"
        @blur="focus = false"
        @change="handleChange"
        :name="name"
        :disabled="isDisabled"
        tabindex="-1"
      >
    </span>
```

在第一个span标签中，`is-checked`属性便是选中选项的关键。这个属性的值依赖model与label是否相等。其中，label是el-radio标签的属性，而model来自计算属性，取得是v-model的值。当v-model中绑定的value值与el-radio中label属性的值相同，则添加is-checked class，由此控制el-radio__inner展示为选中状态。

组件中还针对`tab`操作做出了对应的判断。通过`tabindex`的设置结合是否为`disabled`。

#### change事件触发

```js
methods: {
      handleChange() {
        this.$nextTick(() => {
          this.$emit('change', this.model);
          this.isGroup && this.dispatch('ElRadioGroup', 'handleChange', this.model);
        });
      }
    }
```

`change`事件的触发除了自身el-radio上绑定的`change`事件，在使用了`el-radio-group`父组件的情况下，同时需要触发其`change`事件。

这里的`dispatch`方法通过`mixins`的`Emitter`引入，其作用在于向上查找最近的指定组件名的父级组件，并触发相应的方法。

使用`nextTick`是由于`model`是计算属性，其`getter`依赖`this._radioGroup`，这是一个父类实例。因此，需要等到它更新之后，再调用`$emit`。

```js
model: {
  get() {
    console.log(this._radioGroup, 'dom')
    return this.isGroup ? this._radioGroup.value : this.value
  },
  set(val) {
    if (this.isGroup) {
      this.dispatch('ElRadioGroup', 'input', [val])
    } else {
      this.$emit('input', val)
    }
    this.$refs.radio &&
      (this.$refs.radio.checked = this.model === this.label)
  }
},
```

### Checkbox

#### 结构外观

结构同`radio`类似，使用`label`包裹内部两个`span`，其中第一个`span`用于模拟实现勾选，其中包含隐藏的`input`。

勾选的勾不是使用`icon`，而是利用伪类实现了只有右下边框的长方形经过45度旋转后得到，同时利用`scale API`实现配合动画过度实现放大效果。

#### 原生对比

`Vue`的实现仍然是通过底层对`checkbox`做出判断处理，除了数字与`String`外，还支持数组的形式。这是由于`Vue`在底层针对数组类型做了判断。选中状态是对比`checkbox`上绑定的value值与`v-model`的值。如果是数组类型，则选择比对其中是否含有其值。

#### 多选组

利用外层`el-checkbox-group`组件实现，其实现同radio类似，也是通过slot展示子项，并通过对group的配置来达到控制所有子项的目的。

```js
isGroup() {
  let parent = this.$parent;
  while (parent) {
    if (parent.$options.componentName !== 'ElCheckboxGroup') {
      parent = parent.$parent;
    } else {
      this._checkboxGroup = parent;
      return true;
    }
  }
  return false;
},
store() {
  return this._checkboxGroup ? this._checkboxGroup.value : this.value;
}
```

这里获取外层`group`绑定的`v-model`的值，依然通过`isGroup`逐级查找外层指定父元素，并赋值给`this._checkboxGroup`，再通过`store`进行判断后，返回其`value`。该方法可借鉴运用于通过父级组件控制子组件求值与属性绑定。

### Input



### Select

结合了`el-input`与`el-dropdown`绝对定位实现

