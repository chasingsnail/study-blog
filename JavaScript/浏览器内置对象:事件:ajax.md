# 浏览器内置对象属性

在每个环境中，会基于 JS 开发一些当前环境中的特性，例如 Node.js 中的 global 对象，process 对象；浏览器环境中的 window 对象，document 对象等等，这些属于运行环境在 JS 基础上的内容。 

浏览器是一个 JS 的运行时环境，基于 JS 解释器的同时，又增加了许多环境相关的内容。

BOM（浏览器对象模型）：window（核心）、History、Navigator、location、screen（表明客户端的能力）

## window

全局作用域下声明的变量**（特指 var ）**和内容都会变成 window 对象下的属性。

```js
var num = 1
console.log(window.num) // 1
```

### setInterval & setTimeout

二者的前两个参数相同，第一个是回调函数，第二个是等待执行的时间。它们都返回一个 id，传入 clearTimeout 和 clearInterval 都可以清楚该定时操作。

**如果此时队列中没有内容，则会立即执行此回调函数**，如果此时队列中有内容的话，则会等待内容执行完成之后再执行此函数。(所以即使等待时间结束，也不是立刻执行这个回调函数的！)

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

API：`getElementById`、 `getElementsByClassName`、`getElementsByTagName`、`querySelector`、`querySelectorAll` 等

`getElementsByTabName`等返回多个 node 节点的函数返回值**不是数组**，而是浏览器实现的一种数据结构。

获取所有标签：`docuemnt.querySelectorAll('*')、document.getElementsByTagName('*')`

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

## Node

### 节点操作

+ appendChild(node)：向 childNodes 列表末尾添加一个节点，返回新增节点
+ insertBefore(node, referenceNode)：将节点插入变为参考节点的前一个同胞节点。参数为要插入的节点和作为参照的节点。参照节点为null，则与 appendChild 相同。
+ replaceChild(newNode, node)：newNode回替换 node 节点，将其删除。
+ removeChild(node)：删除节点
+ cloneNode(boolean)：创建节点复制。boolean 为 true 是深拷贝，返回复制节点及其下属整个子节点树，false 则为浅复制，仅返回复制节点本身。

### Element

Element 元素的 nodeType 为 1。

#### 属性

tagName：返回当前元素的标签名

#### 方法

getAttribute：获取当前节点属性的结果

setAttribute：设置当前节点属性

#### 调试

`console.dir()`

### Text

text 类型包含所有纯文本内容，nodeType 为 3。

#### 调试

`console.dir()`

### Document

`Node.DOCUMENT_NODE(9)`

### Comment

`Node.DOCUMENT_NODE(8)`

## History（结合 Vue-Router）

History 对象包含用户访问过的 URL。在 HTML 5 中，history 还与客户端有关。


### 属性

length：返回历史列表中的网址数


### 方法

back：加载历史列表中前一个 URL

forward：加载历史列表中的下一个 URL

go：加载历史列表中的某个具体页面，负值表示后退，正值表示前进。不填默认为0，即重载当前页面

pushState：替换地址栏地址，**并加入 history 列表**，不刷新页面

replaceState：替换地址栏地址，**替换当前页面在历史记录中的记录**，不刷新页面

# 事件

DOM 是一个嵌套型的树形树状结构。

## 事件流

事件流描述的是**从页面中接收事件的顺序**。

### 事件冒泡

事件从最具体的元素接收，逐级向上传播。

### 事件捕获

事件从不太具体的节点接收，直到最具体被最具体的元素接收。

### 三个阶段

一个标准的事件流分为**三个阶段**，首先是自上而下的事件捕获状态，然后到达真正触发事件的元素（处于目标阶段），最后是事件冒泡阶段，再从这个元素回到顶部的。

## 事件处理

### HTML 事件处理

直接在 dom 元素中添加：

```html
<p onclick="showAlert()">点击弹出</p>

<script>
	function showAlert() {
    alert('hello')
  }
</script>
```

### DOM0 级事件处理

通过获取 dom 元素之后，设置其 onclick 属性。

```js
var btn = document.getElementById('button')
btn.onclick = function() {
  btn.onclick = null // 移除事件处理程序
  alert('hello')
}

// 也可在外层书写
btn.onclick = null
```

这里需要注意的是内存的释放问题，最好手工移除事件处理程序

### DOM2 级事件处理

（ 无 DOM1 级事件的原因在于 1级 DOM 标准中并没有定义事件相关的内容）

定义了两个方法用于指定和删除事件处理程序：`addEventListener()`和`removeEventListener()`。

#### 参数

1. 处理的事件名，例如 `click`
2. 事件处理程序的函数
3. boolean 值，true 表示在捕获阶段调用，false 表示在冒泡阶段调用。**默认为 false**。

#### 特点

可以实现对同一事件设置多个事件回调函数，依次触发。

`removeEventListener()`删除的事件函数必须与设置的时候**保持相同的函数引用**，因此尽量不要使用匿名函数。

### IE 事件处理

在 IE 中实现了与 DOM 中类似的两个方法：`attachEvent()`和`detachEvent()`。二者添加的事件处理程序都是在冒泡阶段。

#### 参数

1. 事件处理程序名称，例如 `onclick`
2. 事件处理的函数

#### 与 DOM 事件的异同

1. IE 事件处理程序名称，与 DOM 事件的区别在于多了 `on` 前缀，例如 `onclick`
2. 为一个元素添加多个相同事件的处理程序时，DOM 事件是按定义顺序依次触发，IE 事件则是以定义相反的顺序触发。
3. DOM 事件处理程序是在所属元素的作用域内运行，而 IE 的 this 指向全局作用域。
4. 删除的事件函数都需要与设置时保持相同的函数引用

## 事件对象

事件触发后，浏览器会传入一个**事件对象**进入事件回调函数本身。

```js
document.getElementById('button').onclick = function(event) {
  console.log(event)
  alert('hello')
}
```

### DOM 中的事件对象

| 属性/方法                  | 类型     | 含义                                                         |
| -------------------------- | -------- | ------------------------------------------------------------ |
| bubbles                    | Boolean  | 事件是否冒泡                                                 |
| cancelable                 | Boolean  | 是否可以取消事件的默认行为                                   |
| type                       | String   | 事件类型                                                     |
| currentTarget              | Element  | 返回绑定事件的元素，即 `this === event.target`               |
| target                     | Element  | 事件目标（未必是当前元素）                                   |
| defaultPrevented           | Boolean  | 为 true 表示已经调用了 `preventDefault()`(DOM3 级事件)       |
| detail                     | Integer  | 事件相关的细节                                               |
| eventPhase                 | Integer  | 事件处理程序调用阶段：1表示捕获阶段，2表示处于目标，3表示冒泡阶段 |
| preventDefault()           | Funtion  | 取消事件的默认行为，例如取消a标签带有href属性自动跳转行为    |
| stopImmediatePropagation() | Function | 取消事件的**进一步**捕获或者冒泡，并阻止任何事件处理程序被调用(相同事件处理程序) |
| stopPropagation()          | Function | 取消事件进一步捕获或是冒泡                                   |

### IE 中的事件对象

IE 中访问 event 对象有几种不同的方式，取决于事件处理程序的方法。

在 DOM0 级中，event对象作为 window 对象的一个属性存在。

```js
var btn = doucment.getElementById('btn')
btn.onclick = function() {
  var event = window.event
  alert(event.type)
}
```

如果是 attachEvent 定义的事件，则也是通过传入回调函数中。

| 属性/方法    | 类型    | 含义                                                         |
| ------------ | ------- | ------------------------------------------------------------ |
| cancelBubble | Boolean | 默认为 `false`，设置为 `true` 时表示取消事件冒泡（与 `stopPropagation()` 方法作用相同） |
| returnValue  | Boolean | 默认为 `true`，设置为`false`时表示取消事件的默认行为（与 `preventDefault()` 方法相同） |
| srcElement   | Element | 事件的目标（与 target 属性相同）                             |
| type         | String  | 事件类型                                                     |

## 事件委托

针对绑定事件处理程序过多的问题，可以使用事件委托方案来解决。原理是利用了事件冒泡，例如给父节点绑定一个事件监听，子节点的点击事件就会冒泡到父节点上被捕获到，这时候可以通过 `target` 属性来判断是由哪个子节点触发的事件。

## 通用事件模型

该模型主要是为了兼容多个 DOM 等级以及 IE 和主流规范的不同，同时兼容 event 事件本身的内容。

```js
var eventHandler = {
  // 获取 event 对象
  getEvent(event) {
    return event || window.event
  },
  // 获取 target 对象
  getTarget(event) {
    return event.target || event.srcElement
  },
  // 绑定事件
  addEvent(ele, eventType, handler) {
    if (ele.addEventListener) {
      ele.addEventListener(eventType, handler, false)
    } else if (ele.attachEvent) {
      ele.attachEvent(`on${eventType}`, handler)
    } else {
      ele[`on${eventType}`] = handler
    }
  },
  // 解绑事件
  removeEvent(ele, eventType, handler) {
    if (ele.removeEventListener) {
      ele.removeEventListener(eventType, handler, false)
    } else if (ele.detachEvent) {
      ele.detachEvent(eventType, handler)
    } else {
      ele[`on${eventType}`] = null
    }
  },
  // 阻止默认行为
  preventDefault(event) {
    if (event.preventDefault) {
      event.preventDefault()
    } else {
      event.returnValue = false
    }
  },
  // 阻止冒泡
  stopPropagation(event) {
    if (event.stopPropagation) {
      event.stopPropagation()
    } else {
      event.cancelbubble = true
    }
  }
}
```

# Ajax

## XMLHttpRequest

ajax 技术的核心是 XMLHttpRequest 对象，它能够以异步方式从服务端获取信息，不必刷新页面。

```js
var xhr = new XMLHttpRequest()

// 接受三个参数：发送的请求类型、请求 url 、是否异步发送
xhr.open('get', '/ajax.json', true)

// 调用 send 方法发送请求，参数为携带的参数
xhr.send(null)
```

常见的有 `get` 和 `post` 请求。

+ 发送 `get` 请求时，一般把参数放在 `url` 中，例如 `?foo1=bar1&foo2=bar2`
+ 发送 `post` 请求时，数据放在 body 中，一般会以 `form` 表单的形式（通过设置不同的 header ）或者以 json 的形式发送数据

```js
var xhr = new XMLHttpRequest()

// get
xhr.open('get', '/ajax.json?foo=bar', true)
xhr.send(null)

// post
xhr.open('post', '/ajax.json', true)
// post form
xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
var formData = new FormData()
formData.append('foo', 'bar')
xhr.send(formData)
// post json
xhr.setRequestHeader('Content-Type', 'application/json')
var jsonData = {
  foo: 'bar'
}
xhr.send(jsonData)
```

同样的，通过监听 readyState 的变化来判断当前的请求状态。

readyState状态如下：

+ 0：未调用 open 方法
+ 1：已经调用 open 方法但为调用 send 方法
+ 2：已经调用 send 方法但未收到返回
+ 3：收到部分响应数据
+ 4：收到所有响应的数据

xhr 实例上还有一些方法和属性。

| 属性/方法          | 说明                                   |
| ------------------ | -------------------------------------- |
| responseText       | 响应主体返回的文本                     |
| readyState         | 监听 readyState 的变化来判断当前请求的 |
| status             | 响应的 HTTP 状态码                     |
| statusText()       | HTTP 状态说明                          |
| getRequestHeader() | 获取服务器返回的 header                |

完整发送请求的过程如下：

```js
var xhr = new XMLHttpRequest()

xhr.onreadyStatuschange = function () {
  if (xhr.readyStatus !== 4) return
  if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) {
    alert(xhr.responseText)
  } else {
    alert('error' + xhr.status + xhr.statusText())
  }
}

xhr.open('get', '/ajax.json', true)

xhr.send(null)
```

## Fetch API

ES6之后，浏览器端增加了 fetch api

`fetch(url [, options])`，url 为请求地址，options 为配置参数。

特点如下：

+ 返回一个 promise 的结果
+ 默认不带 cookie，需要使用配置 `credentials: "include"`
+ 只有当网络故障或请求被阻止时，才会标记为 reject。否则即使返回码为 4xx 或 5xx，也仍然会 resolve 这个 promise

```js
fetch('/ajax.json', {
	method: 'post'
}).then(() => {
  console.log('请求发送成功')
})
```

与 ajax 请求不同的是，需要调用一些方法才能够拿到真正服务端返回的结果。

```js
fetch('/ajax.json')
	.then(res => {
  	res.text() // 返回字符串
  	res.json() // 返回 json
  	res.blob() // 一般指返回文件对象
  	res.arrayBuffer() // 返回一个二进制文件
  	res.formData() // 返回表单格式内容
	})
```

例如常见的 json 请求，需要调用一次 json() 方法来使返回结果序列化为  json。

还有一些常见的 response 属性

+ Response.status 状态码
+ Response.statusText 状态码信息
+ Response.ok 检查 response 的状态是否在 200 - 299 这个范围内，返回一个 boolean 值。可以结合返回的 promise 是否 resolve 来判断是一个请求是否成功

### 终止请求

可以通过 **AbortController** 和 **AbortSignal** API来终止。如果调用时请求完成了，不会发生错误。如果请求没有完成，fetch 会抛出一个异常，并可以在返回的 promise 中的 catch 捕获到。

```js
const controller = new AbortController()
const signal = controller.signal

fetch('./data.json', {
  signal
}),then(() => {
  console.log('请求成功')
}).catch(err => {
  if (err.name === 'AbortError') {
    console.log('请求终止')
  }
})

// 可以通过调用controller.abort()来通知终止事件
controller.abort()
```

# 通用请求方法封装

```js
function fetch(url, config) {
  if (window.fetch) {
    return window.fetch(url, config)
  }
  return new Promise((resolve, reject) => {
    // 生成兼容 xhr 对象
    function createXHR() {
      if (typeof XMLHttpRequest !== undefined) {
        return new XMLHttpRequest()
      }
      // 兼容早期 IE
      if (typeof ActiveXObject !== undefined) {
        if (typeof arguments.callee.activeXString !== 'string') {
          var versions = ['MSXML2.XMLHttp.6.0', 'MSXML2.XML2.XMLHttp.3.0', 'MSXML2.XMLHttp']
          for (var i = 0; i < versions.length; i++) {
						try {
							new ActiveXObject(versions[i]);
							arguments.callee.activeXString = versions[i];
							break;
 						} catch (e) {}
 					}
        }
        return new ActiveXObject(arguments.callee.activeXString)
      }
      throw new Error('不支持 xhr 相关内容');
    }
    
    var xhr = createXHR()
    xhr.onreadStatuschange = function () {
      if (xhr.readyStatus !== 4) return
      const { status, statusText } = xhr
      var body = 'response' in xhr ? xhr.response : xhr.responseText
      // 模拟 fetch 返回结果属性与方法
      var response = {
        status: status || 200,
        statusText: statusText || 'ok',
        ok: status >=200 && status < 300,
        text() {
          if (typeof body === 'string') {
            return Promise.resolve(body)
          }
        },
        json() {
          return this.text().then(JSON.parse)
        }
      }
      resolve(response)
    }

    xhr.open(config.method || 'get', url, true)

    xhr.send()
  })
}
```

