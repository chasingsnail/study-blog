## webpack-dev-server

运行 npm run dev 时，实际运行的是 webpack-dev-server 命令。

该命令主要做了以下几件事：

+ 启动 webpack，生成 compiler 实例。其中 cmopiler 有多种方法，例如可以启动 webpack的编译，监听本地文件变化等。
+ 使用 express 框架启动本地的 server，使得浏览器可以访问本地的静态资源。
+ 本地 server 启动之后，再去启动 websocket 服务，建立本地服务与浏览器的双向通信。当本地文件发生变化，可以通过 websocket 通知浏览器端。

## Server 实例

在启动本地 server 之前，还会做几项工作。

首先是调用 `updateCompiler(compiler, options)` 方法，该方法用于获取websocket客户端代码路径，以及获取webpack热更新代码路径。

```js
// 获取websocket客户端代码
const clientEntry = `${require.resolve(
    '../../client/'
)}?${domain}${sockHost}${sockPath}${sockPort}`;

// 根据配置获取热更新代码
let hotEntry;
if (options.hotOnly) {
    hotEntry = require.resolve('webpack/hot/only-dev-server');
} else if (options.hot) {
    hotEntry = require.resolve('webpack/hot/dev-server');
}
```

+ webpack-dev-server/client
+ webpack/hot/dev-server

并将这两个地址通过修改webpack入口文件注入，一同打包进bundle文件。

webpack-dev-server/client 用于浏览器（客户端）接收 websocket 消息。因此需要将其通信代码塞进打包入口文件中，在客户端执行。

webpack/hot/dev-server 用于检查更新逻辑。

再者，注册了一个 webpack 编译完成的监听事件。

## 监听文件编译

每次本地代码修改会触发重新编译，这是通过 webpack-dev-middleware 实现的。它通过webpack暴露的API监听了文件变化，并告知webpack将其编译打包至内存中。

这里是通过第一步提到的compiler实例中的watch方法来实现：

+ 首先对本地文件代码进行编译打包
+ 编译结束后开启对文件的继续监听

再者，执行了 setFs 方法（基于 memory-fs），将编译后的文件打包到内存中。存在内存的原因在于访问内存代码比访问文件系统要快，同时也减少了代码写入文件的开销。

当编译结束时，会调用`_sendStats` 方法，通过 websocket 向浏览器发送通知，包含 ok 和 hash 事件。这样浏览器能够拿到最新的hash值，以便给下一次编译结束使用。

## 浏览器接收通知

浏览器端是通过上述将 webpack-dev-server/client 代码注入入口文件，运行在浏览器中实现的。

通过 socket 方法建立了 websocket 与 服务端的连接，同时注册了多个监听事件：

+ hash 事件，更新最新一次打包后的hash值，将其暂存
+ ok事件，进行热更新检查
+ still-ok：代码无改动

热更新检查调用了 reloadApp 方法，该方法中会根据hot的配置来决定是刷新浏览器还是对代码进行热更新，如果配置了热更新，则通过 Node 的 EventEmitter 发出 webpackHotUpdate 消息。否则直接刷新浏览器页面。

webpack-dev-server/client 端并不能够请求更新的代码，也不会执行热更模块操作，而把这些工作又交回给了 webpack，webpack/hot/dev-server 的工作就是根据 webpack-dev-server/client 传给它的信息以及 dev-server 的配置决定是刷新浏览器呢还是进行模块热更新。

```js
// webpack-dev-server/client/index.js
hash: function msgHash(hash) {
    currentHash = hash;
},
ok: function msgOk() {
    // ...
    reloadApp();
},
// ...
function reloadApp() {
  // ...
  if (hot) {
    log.info('[WDS] App hot update...');
    const hotEmitter = require('webpack/hot/emitter');
    hotEmitter.emit('webpackHotUpdate', currentHash);
    // ...
  } else {
    log.info('[WDS] App updated. Reloading...');
    self.location.reload();
  }
}
```

webpack/hot/dev-server 用于接收 webpackHotUpdate 事件，该文件同样是注入入口文件后运行在浏览器中。首先，拿到了最新的hash值，然后调用了 module.hot.check 方法。

当我们配置了HMR之后，会在bundle文件中自动添加hot方法（基于Tapable机制），其中包含了check方法，用于检测是否有新的更新。

该方法返回一个promise，在注入代码部分，可以看到，显式调用了 hotDownloadManifest，结合保存的 hash 值，发送了 `[hash].hot-update.json`的ajax请求。

请求的结果包含了 h (下次更新使用的hash) 和c （需要更新的文件）。

接着调用了 hotDownloadUpdateChunk 方法，通过JSONP的方式发送 `[hash].hot-update.js` 请求。这里使用JSONP的原因在于其获取的代码是可以直接执行的，该请求返回的代码是包裹在 webpackHotUpdate 方法内部。

该方法会讲更新的模块赋值给全局变量 hotUpdate。

接着调用hotUpdateDownloaded，通过hotApply进行代码的替换。删除过期模块依赖，添加新的模块。并通过`__webpack_require__`方法执行相关模块的代码。在过程中过出现错误，则退回浏览器刷新页面。

## 业务端

当新模块代码替换旧模块代码之后，需要在业务端代码中调用HRM的accept方法，添加模块更新后的回调函数。及时更新页面数据。

```js
if (module.hot) {
  module.hot.accept('./xx.js', () => {
    // do sth ...
  })
}
```



## 总结

基于websocket来实现的。在运行webpack-dev-server命令时，会启动webpack，监听文件的编译状态。另外在开启本地服务之前会修改webpack配置中的入口entry的配置，添加webpack-dev-client的代码一起打包，最后打包运行在客户端，可以让浏览器端接收到websocket消息。浏览器端会收到hash、ok的消息，会将hash保存，当收到ok的消息时进行重载。重载需要判断是否配置了热模块更新。如果配置了热重载会发送两个请求，首先调用请求是否有更新的文件，另外通过jsonp请求最新的模块代码后立即执行，最后执行更新操作，进行模块的替换，删除过期的模块依赖等等，添加新的模块。最后执行新模块的代码。如果出现错误则会刷新浏览器。

![](https://pic1.zhimg.com/80/v2-f7139f8763b996ebfa28486e160f6378_720w.jpg)

## 参考

+ [轻松理解webpack热更新原理](https://juejin.im/post/5de0cfe46fb9a071665d3df0)
+ [Webpack HMR 原理解析](https://zhuanlan.zhihu.com/p/30669007)