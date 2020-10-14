## Webpack

### 为什么使用，解决了什么问题

代码层面

+ 通过对代码的压缩，公共模块、第三方模块的抽离拆分，异步加载等方法减小代码体积，提升加载效率
+ 能够集成多种 loader 来编译高级语法 TS、ES6、Scss
+ 自动化兼容性与错误检查 （polyfill、eslint）

研发流程角度

+ 统一构建流程和产出
+ 能够自动集成公司构建，不用重复配置，统一开发环境，提高了工程化效率

### 基本使用

[基本配置](https://juejin.im/post/6844904031240863758)

### devTool

+ eval：每个模块使用 eval() 来执行，且有 //@ sourceURL，构建快速，缺点在于无法映射到转换后的代码
+ source-map：可根据转换后的代码定位到转换前的代码，便于开发调试
+ inline：source Map 内容通过 base64 放在 js 文件中
+ hidden：不自动引入 source-map
+ cheap：不显示对应源代码**列数**
+ module：显示 loader 中的 source-map

开发环境下适用：inline-cheap-eval-source-map

正式环境一般不显示 source-map

### loader

#### 常见 loader

+ file-loader: 加载文件资源，如 字体 / 图片 等，具有移动/复制/命名等功能；
+ url-loader: 通常用于加载图片，可以将小图片直接转换为 Date Url，减少请求；
+ babel-loader: 加载 js / jsx 文件， 将 ES6 / ES7 代码转换成 ES5，抹平兼容性问题；
+ ts-loader: 加载 ts / tsx 文件，编译 TypeScript；
+ style-loader: 将 css 代码以标签的形式插入到 html 中；
+ css-loader: 分析`@import`和`url()`，引用 css 文件与对应的资源；
+ postcss-loader: 用于 css 的兼容性处理，具有众多功能，例如 **添加前缀，单位转换** 等；
+ less-loader / sass-loader: css预处理器，在 css 中新增了许多语法，提高了开发效率；

#### loader 中的 this

this 指向 loaderContext，该对象上有callback、data、loaderIndex、addContextDependency等属性。

#### 自定义 loader

可通过 webpack 配置 resolveLoader 字段来自定义 loader 引用来源（默认从 node_modules 中获取）

输入与输出都是字符串的形式，可以对字符串进行修改。

如果 loader 可以传入 options 的情况，可以通过 loader-utils 的 getOptions 获取配置的 options。

参考：https://juejin.im/post/6844904054393405453

### plugin

#### 自定义plugin

**apply 方法**

```js
// customPlugin.js
class firstPlugin {
  constructor (options) {
    console.log('firstPlugin options', options)
  }
  apply (compiler) {
    compiler.plugin('done', compilation => {
      console.log('firstPlugin')
    ))
  }
}

module.exports = firstPlugin
```

其中，compiler 包含了 webpack 中所有的配置信息，全局唯一。

Compilation 相当于一个编译实例，每次文件改动时，webpack会创建一个新的 Compilation 对象。它包含了当前输入资源、输出资源、变化的文件等等，在这个过程中会触发事件钩子。**plugin 通过监听会贯穿在整个生产过程的每个步骤，对编译文件进行扩展。**

### loader 与 plugin 的区别

loader 是模块转化器，作用在于处理任意类型的文件，并且将它们转换成一个让 `webpack` 可以处理的有效模块。输入输出都是字符串的形式。

plugin 通过监听会贯穿在整个生产过程中触发事件钩子，对编译文件进行扩展。

### 手写 loader / plugin

### bundle、chunck、module 的区别

我们书写的文件是一个个的 module，可以导出或被别的文件引用。

在 webpack 打包过程中，chunk 是由多个 module 合并成的，会根据引用依赖关系生成 chunk 文件。（entry、import() splitChunk 等）

处理完成后会输出 bundle 文件。一般来说一个 chunk 对应一个 bundle，但比如我们配置了 css 抽离插件，则会从 chunk 中单独抽离出一个 css bundle 文件。

### 前端模块化 & 模块包装

ESM 为静态引入，在没有运行时静态分析，因此可以被 tree-shaking，无法在运行时判断引用。

CommonJS 为动态引入，在运行时加载，无法被 tree-shaking。

### 如何实现懒加载

import() 方法返回一个 promise，可以使用 /* webpackChunkName: "xxxx" */ 的形式来对打包后的文件命名。

### dynamic import 的实现（jsonp）

通过 JSONP + promise 包裹的方式来实现动态加载。

动态加载通过 JSONP 方式，生成 script 标签挂在到 head 中；拿到返回的结果后执行异步加载回调。这一过程通过 promise 包裹的形式串行。加载完成异步模块后，执行这个模块文件的代码，将异步模块注入全局 modules 中，最后把promise resolve 掉，在 then 方法中通过 require 方法加载注入到全局 modules 的异步模块，拿到模块导出的对象后执行加载完成后的回调。

### 热更新原理

```js
if(module && module.hot) {
    module.hot.accept()
}
```

基于 websocket 来实现的。在运行 webpack-dev-server 命令时，会启动 webpack，监听文件的编译状态。另外在开启本地服务之前会修改webpack配置中的入口 entry 的配置，将 websocket、热更新相关的代码一起打包，最后打包运行在客户端，可以让浏览器端接收到websocket消息。本地文件改动重新编译后，浏览器端会收到hash、ok的消息，会将hash保存，当收到ok的消息时进行重载。

如果配置了热更新模块，先请求返回一个 json，包含了要更新模块的 hash，再通过 jsonp 的方式来获取最新的代码，执行模块的更新替换，删除就模块等。 如果过程中出现错误则会回退为刷新浏览器来获取最新代码。

详细过程参考：

+ Webpack 热更新模块.md
+ [Webpack HMR 原理解析](https://zhuanlan.zhihu.com/p/30669007)

#### Vue 热更新原理

在 vue-loader 处理中注入了热更新相关的代码。更新粒度是组件级的，通过维护了一个map对象，来存储对应组件的实例。通过往 beforeCreate 和 beforeDestory 注入，在触发时收集与销毁 Map 上对应的实例。在热更新触发后，对组件进行重新渲染（$forceUpdate）。

### 构建过程

（核心是 Tapable 机制类似于 EventEmitter 的订阅分发系统）

读取文件配置，从入口文件开始执行编译。

按文件的类型，调用相应的 loader 对模版进行编译，将loader处理后的文件通过acorn抽象成抽象语法树AST，然后遍历AST，递归分析构建该模块的所有依赖并切收集依赖关系，形成一颗关系树。在 `Webpack` 运行的生命周期中会广播出许多事件，`Plugin` 可以监听这些事件，在合适的时机通过`Webpack`提供的`API`改变输出结果。

webpack 根据入口文件和模块之间的依赖关系，会将代码包装成一个个 chunk，根据依赖和配置确定输出内容，这时仍可以通过 plugin 进行文件的修改。

最后根据 output 配置将文件内容写入到执行的文件夹中。

### 优化

#### splitChunks 代码分割

该配置目的在于抽离出多次引用的公共代码，抽离出来单独打包，后续的引用直接读取缓存而不需要重复下载。

```js
// webpack 默认配置
module.exports = {
  //...
  optimization: {
    splitChunks: {
      //在cacheGroups外层的属性设定适用于所有缓存组，不过每个缓存组内部可以重设这些属性
      chunks: "async", //将什么类型的代码块用于分割，三选一： "initial"：入口代码块 | "all"：全部 | "async"：按需加载的代码块
      minSize: 30000, //大小超过30kb的模块才会被提取
      maxSize: 0, //只是提示，可以被违反，会尽量将chunk分的比maxSize小，当设为0代表能分则分，分不了不会强制
      minChunks: 1, //某个模块至少被多少代码块引用，才会被提取成新的chunk
      maxAsyncRequests: 5, //分割后，按需加载的代码块最多允许的并行请求数，在webpack5里默认值变为6
      maxInitialRequests: 3, //分割后，入口代码块最多允许的并行请求数，在webpack5里默认值变为4
      automaticNameDelimiter: "~", //代码块命名分割符
      name: true, //每个缓存组打包得到的代码块的名称，为 true 时，会就key自动选择一个名称；为false时适用于生产环境，避免不必要的命名（此时打包结果通常为0.js、1.js）;如果为string，则会将缓存组打包成一个chunk，名称为该string
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/, //匹配node_modules中的模块
          priority: -10, //优先级，当模块同时命中多个缓存组的规则时，分配到优先级高的缓存组
        },
        default: {
          minChunks: 2, //覆盖外层的全局属性
          priority: -20,
          reuseExistingChunk: true, //是否复用已经从原代码块中分割出来的模块
        },
      },
    },
  },
};
```

详细应用： [在淘宝优化了一个大型项目，分享一些干货](https://juejin.im/post/6844904183917871117)

#### happyPack

原理是将这任务分解到多个子进程中去并行处理，等子进程处理完成后把结果发送到主进程中，缩减构建事件。

#### thread-loader

除了happypack外，webpack4官方推荐，提供了thread-loader的解决方案。用法是将thread-loader放置在其他loader之前，放置在其后的loader就会单独在一个worker池中运行。

#### JS多进程压缩

webpack默认使用TerserWebpackPlugin，**默认开启**多进程与缓存，可以在`.cache`中看到相关的文件。

#### 模块缓存

作为 dll 的替代方案，HardSourceWebpackPlugin为模块提供中间件缓存，配置相关插件后，第二次开始的构建时间会有很大程度上的缩减。

#### tree-shaking

依赖代码静态分析能力，用来清除代码中没有被使用到的部分。webpack 4 生产模式下**自动开启**。注意点是，能够去除的代码必须是 ES6 模块的，不能是 CommonJS 规范。而 Babel preset 会默认将任何模块类型都转译成 CommonJS 类型，因而导致 tree-shaking 失效，解决办法是设置 "module": false。

#### 打包构建优化总结

+ 构建速度 （开发阶段）
  + loader 缓存：大部分 `loader` 都提供了`cache` 配置项。比如在 `babel-loader` 中，可以通过设置`cacheDirectory` 来开启缓存，`babel-loader?cacheDirectory=true`。不支持 cache 配置的 loader 可通过 cache-loader 将编译写过写入缓存。
  + ignorePlugin：忽略第三方包指定目录，让这些指定目录不要被打包进去，例如 moment 的语言包（这样需要手动引入需要的语言）
  + happyPack / thread-loader 任务分解到多个子进程中去并行处理
  + ParallelUglifyPlugin
  + 热更新 no production
  + DLL no production
+ 产出性能优化 （打包产出优化）
  + 小图 base64
  + 压缩
  + 路由或者是模块的懒加载提高加载焦虑
  + 抽离第三方库、公共模块 （splitChunks）
  + CDN：常用的库代码放置到公司 CDN
  + scoped hosting ：作用域提升 scope hosting 将分散的模块划分到同一个作用域中，有效减少打包后的代码体积和运行时的内存损耗
  + 删除无用代码 tree-shaking

优化本身是一件拆东补西的事。比如提取出一个公共 chunk，打包产出的文件就会多一个，也必然会增加一个网络请求。当项目很庞大，每个公共模块单独提取成一个 chunk 会导致打包速度出奇的慢，影响开发体验，需要在包的大小和数量做一个权衡，将重复的较大模块单独提取，而将一些重复的小模块打包到一个 chunk，以减少包数量，同时不能让这个包太大，否则会影响页面加载时间。

+ dll
+ tree-shaking
+ scope-hosting
+ code-splitting
+ happyPack 等
+ tree-shaking

### webpack 的缺点 （对比 bundleless）

[Webpack 打包太慢，试试 Bundleless](https://segmentfault.com/a/1190000023161176)

## Babel

Babel 用于解决 JS 不同版本的语法差异。Babel 本身只关注语法是否符合 ES5 的规范，会解析例如箭头函数、解构赋值等新语法；而对于新的 API 不会进行解析，例如 includes，Promise 等 API。因此还需要 polyfill

### 基本配置

### 手写 plugin

### 运行机制

### babel-preset

babel 本质上是通过插件来完成各种流程的转换，如果不给 Babel 装上插件，它将会把输入的代码原封不动地输出。preset 可以作为 Babel 插件的组合，该模块预设了一组常用的插件集合。`env`preset 这个 preset 包括支持现代 JavaScript(ES6+) 的所有插件。

### babel-polyfill

Babel 无法针对新的 API 进行降级转换，例如 includes 等，因此需要 babel-polyfill 来完成

babel-polyfill 本质上是 core-js 与 regenerator 的集合

+ core-js：转义各种高级新 API，例如 Promise、includes 等
+ regenerator：转义 generator 语法

在 babel 7.4 之后，弃用 babel-polyfill。

不推荐直接引入 polyfill 的方式（引入所有），而是改为按需引入（引入浏览器所需）配置即可（结合 env）：

.babelrc 配置方式：

```json
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "useBuiltIns": "usage",
        "corejs": 3
      }
    ]
  ]
}
```

Babel.config.js 配置方式：

```js
const presets = [
[
  "@babel/env",
      {
        targets: {
        edge: "17",
        chrome: "64",
        firefox: "67",
        safari: '11.1'
      },
      useBuiltIns: "usage",
      corejs: 3
    }
  ]
]

module.exports = { presets }
```

babel-polyfill 的问题在于会污染全局变量，其实现方式是通过重写全局 API 的形式，例如 window.Promise = xxx 的方式。

### Babel-runtime

能够提供一个沙盒环境，可以将 core-js 的内置 API 换成一个别名，避免全局污染。额外安装 @babel/runtime-corejs3，去掉 presets 中对于按需加载的配置。

```js
{
  "presets": [
    [
      "@babel/preset-env"
    ]
  ],
  "plugins": [
    [
      "@babel/plugin-transform-runtime",
      {
        "corejs": 3
      }
    ]
  ]
}
```

由于是动态引入，并非挂载到全局上，针对实例化对象的方法，例如 [].include(x) 无法使用

#### babel-runtime 和 babel-polyfill 的区别

babel-runtime 不会污染全局变量，推荐在开发库的时候使用，同时它也能够支持按需引入，但是相关的 core-js 包会大一些。

babel-polyfill 是通过覆盖原型或全局的方法来做兼容，在独立的 web 开发项目中可以使用。

#### 动态 polyfill

阿里云链接或 polyfill.io 通过检测 ua 来自动引入当前浏览器所需的 polyfill

# 拓展

+ [Babel 插件有啥用？](https://zhuanlan.zhihu.com/p/61780633)
+ [Webpack 是怎样运行的?（一）](https://zhuanlan.zhihu.com/p/52826586)
+ [Webpack 是怎样运行的?（二）](https://zhuanlan.zhihu.com/p/53044886)