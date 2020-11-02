## Performance API

![](https://pic4.zhimg.com/80/v2-8cff53aff488008e57750b4b2faa968f_1440w.jpg)

### connectStart connectEnd

TCP 建立连接与连接成功时间点。

tcp 链接耗时 = connectEnd - connectStart

### domComplete

html 文档完全解析完毕

### domContentLoadedEventEnd

代表 DOMContentLoaded 事件触发时间点。文档加载完毕后出发，html 文档不会等待样式、图片等加载，早于 load 事件

### domContentLoadedEventStart

代表 DOMContentLoaded 事件之前的时间

```js
// performance API
class Performance {
   
}
```

页面加载总耗时 ： loadEventStart - navigationStart

白屏时间：用户第一次进入页面 到 页面上第一个元素出现的时间

Vue 项目中可以在根 Vue 实例初始化时，传入 mixins，记录 created 触发时间作为白屏时间。

## 数据上报





## 图片优化

懒加载



# 埋点

## 代码埋点

### 优势

+ 灵活，可以写到代码任何位置，上报任何数据

### 缺点

+ 每次丢该需要消耗研发
+ 需上线

## 无代码埋点

监听页面上所有事件