## Performance API

<img src="/Users/mac/Library/Application Support/typora-user-images/image-20201007095651724.png" alt="image-20201007095651724" style="zoom:50%;" />

### connectStart connectEnd

TCP 建立连接与连接成功时间点。

tcp 链接耗时 = connectEnd - connectStart

domComplete

html 文档完全解析完毕

domContentLoadedEventEnd

代表 DOMContentLoaded 事件触发时间点。文档加载完毕后出发，html 文档不会等待样式、图片等加载，早于 load 事件

domContentLoadedEventStart

代表 DOMContentLoaded 事件之前的时间



页面加载总耗时 ： loadEventStart - navigationStart

白屏时间：Vue create



## 图片优化

懒加载