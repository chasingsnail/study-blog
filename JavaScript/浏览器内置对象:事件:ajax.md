# 浏览器内置对象属性

在每个环境中，会基于 JS 开发一些当前环境中的特性，例如 Node.js 中的 global 对象，process 对象；浏览器环境中的 window 对象，document 对象等等，这些属于运行环境在 JS 基础上的内容。 

浏览器是一个 JS 的运行时环境，基于 JS 解释器的同时，又增加了许多环境相关的内容。

## window

全局作用域下声明的变量和内容都会变成 window 对象下的属性。

```js
var num = 1
console.log(window.num) // 1
```

### setInterval & setTimeout

二者的前两个参数相同，第一个是回调函数，第二个是等待执行的时间。它们都返回一个 id，传入 clearTimeout 和 clearInterval 都可以清楚该定时操作。

如果此时队列中没有内容，则会立即执行此回调函数，如果此时队列中有内容的话，则会等待内容执行完成之后再执行此函数。(所以即使等待时间结束，也不是立刻执行这个回调函数的！)

对于 setInterval，仅当定时器没有其他代码实例时，才会将定时器代码添加到队列中。在 setInterval 中如果回调函数执行过长，会存在某个任务丢失的情况。这种情况可以使用setTimeout来模拟setInterval。

### alert，confirm，prompt 等交互 API

alert 会弹出一个警告框，同时可能会导致页面 JS 停止执行。

confirm 会弹出一个确认框，返回 boolean（确定/取消）

prompt 可以输入一段文字并返回

## Location

通过 `window.location.xx`访问

`https://baidu.com:8010/api/getUser?foo=bar#hash`

### 属性

+ href: `https://baidu.com:8010/api/getUser?foo=bar#hash`
+ protocol: `https`
+ host
  + hostname: baidu.com
  + port: 8010
+ pathname: `/api/getUser`
+ search: `?foo=bar`
+ hash: `#hash`

### 方法

+ reload：重新载入当前页面
+ replace：用新的页面替换当前页面

## Document

### 选择器

API：`getElementById`、 `getElementsByClassName`、`getElementsByTabName`、`querySelector`、`querySelectorAll` 等

`getElementsByTabName`等返回多个 node 节点的函数返回值**不是数组**，而是浏览器实现的一种数据结构。

### 创建元素

`document.createElement`能够创建一个 dom 元素。当有新增多个元素时，可以先创建一个 dom 片段（`document.createDocumentFragment`），拼接完整后再一次性插入，减少重排（reflow）的影响。

### 属性

title：设置或返回当前页面的标题

domain：展示当前网站的域名

url：当前网页的完整链接

anchors：返回所有的锚点，带 name 属性的 a 标签

forms：返回所有 form 标签集合

images：返回所有 img 标签集合

link：返回所有带 href 属性的 a 标签

## Element

Element 元素的 nodeType 为 1。

### 属性

tagName：返回当前元素的标签名

### 方法

getAttribute：获取当前节点属性的结果

setAttribute：设置当前节点属性

### 调试

`console.dir()`

## Text

text 类型包含所有纯文本内容，nodeType 为 3。

### 调试

`console.dir()`

## History（结合 Vue-Router）

History 对象包含用户访问过的 URL。在 HTML 5 中，history 还与客户端有关。


### 属性

length：返回历史列表中的网址数


### 方法

back：加载历史列表中前一个 URL

forward：加载历史列表中的下一个 URL

go：加载历史列表中的某个具体页面

pushState：替换地址栏地址，**并加入 history 列表**，不刷新页面

replaceState：替换地址栏地址，**替换当前页面在历史记录中的记录**，不刷新页面

# 事件



# （重要，看公开课）Ajax

