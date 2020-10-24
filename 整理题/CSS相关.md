## BFC

BFC 是页面的 CSS 渲染的一部分。是一个独立的布局渲染环境，其中的元素布局是不受外界的影响。

### 布局规则

+ BFC是一个独立的容器，外面的元素不会影响里面的元素
+ 内部的 Box 会在垂直方向上一个接一个的放置
+ 垂直方向上两个块外边距重叠
+ BFC 区域不会与浮动元素重叠
+ 计算 BFC 高度时，浮动元素也参与计算
+ 在BFC中，每一个盒子的左外边缘（margin-left）会触碰到容器的左边缘(border-left)（从左到右的格式化）

### 触发条件

+ float 值不为 none
+ position 的值不是 static 或者 relative
+ display 的值是 inline-block、table-cell、flex、table-caption或者inline-flex
+ overflow 的值不是 visible
+ 网格元素
+ flex

### 作用

#### 外边距重叠

多个相邻的元素（父子或兄弟）在垂直方向上的外边距会发生叠加。因此可以将元素通过 div 包裹使其成为一个 BFC 来消除外边距叠加的影响。这是由于 BFC 内部的元素不会影响到外部元素，给兄弟元素的其中一个元素包裹上 div 后并触发 BFC 后，其自身的margin 不会再影响外部，是一个独立的部分，因此两个元素的外边距是相互独立计算的。

#### 清除浮动的影响

父元素未设置高度且子元素为浮动元素的情况下，会产生父元素高度坍塌的问题。此时可以将父元素设置为 BFC，按照其布局规则，计算高度时会将浮动元素也计算在内。（仍然是由于自身内部布局不影响外部，因此需要将浮动元素参与计算），由此消除了浮动带来的影响。

### 自适应布局

按每一个盒子的左外边缘（margin-left）会触碰到容器的左边缘(border-left)规则，一个浮动元素和一个块级 div 会形成二者发生重叠的效果。我们可以将块级元素触发 BFC 后便不会与浮动元素重叠。

### 参考

https://blog.csdn.net/sinat_36422236/article/details/88763187

## 布局

### Flex（弹性） 布局

可以运用在解决垂直居中的问题

#### 容器属性

+ flex-direction 决定主轴方向
  + row （默认）
  + row-reverse 
  + column 
  + column-reverse  
+ flex-wrap 换行
  + nowrap 不换行（默认）
  + wrap 换行
  + wrap-reverse 换行后第一行在下
+ flex-flow  `flex-direction` 和 `flex-wrap` 的组合简写
+ justify-content 主轴上的对齐方式
  + flex-start 左对齐（默认）
  + flex-end 右对齐
  + center 居中
  + space-between 两端对齐，元素间间隔相等
  + space-around 每个项目两侧的距离相等
+ align-items 交叉轴上的对齐方式
  + flex-start 上对齐
  + flex-end 下对齐
  + center 居中
  + baseline 与项目的第一行文字的基准线对齐
  + Stretch 如果元素未设置高度或者设置为 auto，则会占满整个容器高度（默认）
+ align-content 多行（主轴）情况下对齐方式
  + flex-start
  + flex-end
  + center
  + space-between
  + space-around
  + stretch （默认）

#### 项目属性

+ order 排列顺序，默认为 0。数值越小越靠前

+ flex-grow 元素的放大比例。

  默认为 0，即即使存在剩余空间也不放大。如果所有元素的 flex-grow 都为1，则等分剩余空间。如果其中一个为2，其余为1，则前者占据空间多一倍。

+ flex-shrink 元素的缩小比例

  默认为 1，即表示剩余空间不足时，将元素缩小。如有元素设置为 0，则空间不足时不缩小。负值无效。

+ flex-basis 元素占据空间

  默认为 auto，即元素本来的大小。在有多余分配空间之前，可根据该属性来设置元素占用的空间，其值与设置 width 或 height 相同（例如100px）

+ flex  `flex-grow`、`flex-shrink` 和 `flex-basis` 的组合简写

  默认值为三者原本默认值，即 `0 1 auto` 。后两个属性可选。即当设置 `flex: 1` 时，表示 `flex-grow: 1`。

  该属性有两个快捷值：auto（1 1 auto）和 none （0 0 auto）

+ align-self

  该属性可设置单个元素的交叉轴对齐方式，即覆盖 align-items 属性。默认值为 auto，即继承自 align-items。属性枚举值与 align-items 相同

#### 参考

+ [flex 基础](http://www.ruanyifeng.com/blog/2015/07/flex-grammar.html)
+ [flex 常用布局](http://www.ruanyifeng.com/blog/2015/07/flex-examples.html)

### Grid 布局

Grid 布局是将容器划分成"行"和"列"，产生单元格，然后可以指定"元素"所在的单元格。用法是将容器的 display 设置为 grid 或 inline-grid。

#### 常用属性

+ grid-template-columns、grid-template-rows 定义每一列、行的宽高

  ```css
  /* 定义了一个三行三列，且列宽和行高都为 100px 的网格 */
  .container {
    display: grid;
    grid-template-columns: 100px 100px 100px;
    grid-template-rows: 100px 100px 100px;
  }
  ```

  + 这里除了使用 px 之外，也可使用百分比。

  + 另外该属性还支持 repeat() 函数，第一个参数表示重复的次数（数字、auto-fill：自动填满），后续的参数代表要重复的项。即 repeat(3, 100px) 等同于 (100px 100px 100px)。

  + 为了方便表示比例关系，还可以使用 fr 关键字，表示占比。例如 grid-template-columns: 1fr 2fr; 表示后者是前者的两倍，类似于 flex 中的 flex-grow
  + auto 浏览器自行决定宽度

+ grid-row-gap、grid-colmn-gap、grid-gap 设置行之间、列之间的间隔

  grid-gap 为grid-column-gap`和`grid-row-gap 的合并简写。

+ 单元格内容位置

  +  justify-items 属性：设置水平位置 start | end | center | stretch（拉伸撑满，默认）
  + align-items 属性：设置垂直位置 同上
  + place-items 属性：align-items 和 justify-items 的合并简写，与第一个值相等时，第二个值可省略。

+ 整体元素在容器中的位置

  + justify-content 属性：水平位置 start | end | center | stretch | space-around | space-between | space-evenly（区别于space-around，表示元素与元素，元素与容器边框之间的距离都相等）
  + align-content：垂直方向 同上
  + place-content：ailgn-content 和 justify-content 的合并简写

#### 常用布局

常见的平铺多行商品的布局就可以使用 grid 布局，它弥补了栅格布局中一行无法设置非 24 公约数的限制（例如一行 5 个或 7 个排列时）。例如实现 n x 5 的排列布局：

```css
.container {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-gap: 16px; /* 适当的间隔 */
}
```

#### 参考

+ [Grid 基础](http://www.ruanyifeng.com/blog/2019/03/grid-layout-tutorial.html)

### 常见布局

+ https://juejin.im/post/6865107864139087886

#### 水平居中

+ 行内元素通过 text-align: center

+ 块级元素通过 margin: 0 auto + 设置宽度

+ 块级元素还可设置父元素为 flex，子元素设置 margin: 0 auto  即可 （无视宽度）

+ flex： 设置justify-content：center （无视宽度）

+ 绝对定位（无视元素宽度）

  ```css
  .ele {
    position: absolute;
    left: 50%;
    transform: translate(-50%, 0); // 表示元素自身宽度的 50%
  }
  ```

  

#### 垂直居中问题

+ 单行文本居中直接设置 line-height 等于父元素高度即可

+ 块级元素可设置父级为 flex，子元素设置 margin: auto 0

+ 行内元素设置 vertical-align: middle

+ 可通过绝对定位，同水平居中

+ flex：justify-content 和 align-items 设置为 center

+ grid：place-items 设置为 center

+ 绝对定位（四周为 0 ）+ margin: auto （此时实现的是垂直水平居中）

  同时设置了四个方向的值使得其中的 div 宽度不为0 ，而是随着包裹其的 box 宽度变化。因此 div 具有流体特性，因此它margin:auto`的填充规则和普通流体元素一模一样。因此当我们给子 div 设置了高度，以及 top、bottom 为 0 时，它表现为正常流体特性，垂直方向多余出来的空间即为 margin auto 可计算的空间。

## 伪类与伪元素

+ 伪类是选择器的一种，用于当已有元素处于的某个状态时，为其添加对应的样式，常用的选择第一个元素或者是鼠标悬浮的状态。

+ 伪元素它更像是在文本中创造出新的元素，而不是在现有的元素上应用类。例如 ::before 或 :: after 配合 content 属性创建不存在文档树的文本。

  ::first-line  ::first-letter  ::before  ::after

CSS3规范中的要求使用双冒号(::)表示伪元素

## 重绘与回流（重排）

前置知识：浏览器渲染过程，[参考](../JavaScript/浏览器渲染.md)

#### 回流的触发

+ 添加或删除可见的 DOM
+ 元素位置发生变化 （绝对定位除外）
+ 元素尺寸发生变化（margin、padding、border、width、height）
+ 内容发生变化（文字变化，图片被另一个尺寸图片替换）
+ 浏览器窗口大小变化

#### 重绘的触发

+ 回流必然会触发重绘
+ 修改样式并且不影响其在文档流中的位置（改变 color、背景颜色等）

浏览器对于频繁的回流与重绘有自己的优化机制，会维护一个队列，达到一定的阈值或时间间隔会清空队列，将多次回流与重绘合变为一行。但是当访问以下属性时会立刻清空队列：

```
clientWidth`、`clientHeight`、`clientTop`、`clientLeft
offsetWidth`、`offsetHeight`、`offsetTop`、`offsetLeft
scrollWidth`、`scrollHeight`、`scrollTop`、`scrollLeft
width`、`height
getComputedStyle()
getBoundingClientRect()
```

因此想要实现动画或过渡效果时，尽量使用以上属性。例如当想要改变某个元素的尺寸时，可以利用 transform scale 属性来替代对于 width 和 height 的直接修改。

#### 规避重绘与回流

+ css
  + 动画效果应用到绝对定位或固定定位元素上
  + CSS 硬件加速
  + 避免设置多层内敛样式
  + 避免 table 布局
+ JS
  + 避免频繁操作样式
  + 避免频繁操作 DOM，可通过先创建 documentFragment，最后一并添加到 DOM 中
  + 频繁的读取会触发回流与重绘的属性时，先将其缓存起来
  + 复杂动画元素使用绝对定位，避免引起父级和后续元素的频繁回流

## 动画相关

+ https://segmentfault.com/a/1190000008015671

## z-index

## 选择器

伪类

+ 极客

## Sass、Less、Stylus

## 浮动

## rem、em、vm、vh