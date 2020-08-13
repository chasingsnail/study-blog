## Webpack

### 为什么使用，解决了什么问题

代码层面

+ 通过对代码的压缩，公共模块、第三方模块的抽离拆分，减小代码体积，加载更快，异步加载等方法提升加载效率
+ 能够编译高级语法 TS、ES6、Scss
+ 自动化兼容性与错误检查 （polyfill、postcss）

研发流程角度

+ 统一开发环境
+ 统一了构建流程和产出
+ 能够自动继承公司构建，提高了工程化效率

### 基本使用

[基本配置](https://juejin.im/post/6844904031240863758)

### loader

#### 常见 loader

+ file-loader: 加载文件资源，如 字体 / 图片 等，具有移动/复制/命名等功能；
+ url-loader: 通常用于加载图片，可以将小图片直接转换为 Date Url，减少请求；
+ babel-loader: 加载 js / jsx 文件， 将 ES6 / ES7 代码转换成 ES5，抹平兼容性问题；
+ ts-loader: 加载 ts / tsx 文件，编译 TypeScript；
+ style-loader: 将 css 代码以``标签的形式插入到 html 中；
+ css-loader: 分析`@import`和`url()`，引用 css 文件与对应的资源；
+ postcss-loader: 用于 css 的兼容性处理，具有众多功能，例如 **添加前缀，单位转换** 等；
+ less-loader / sass-loader: css预处理器，在 css 中新增了许多语法，提高了开发效率；

#### loader 中的 this

this 指向 loaderContext，该对象上有callback、data、loaderIndex、addContextDependency等属性。

#### 自定义 loader

通过常用的 loader-utils 的 getOptions 获取配置的 options。

可通过 webpack 配置 resolveLoader 字段来自定义 loader 引用来源（默认从 node_modules 中获取）

参考：https://juejin.im/post/6844904054393405453

### plugin

#### 自定义plugin

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

Compilation 相当于一个编译实例，每次文件改动时，webpack会创建一个新的 Compilation 对象。它包含了当前输入资源、输出资源、变化的文件等等，可以监听每次编译过程中触发的事件钩子。

### loader 与 plugin 的区别

loader 是模块转化器，的作用在于处理任意类型的文件，并且将它们转换成一个让 `webpack` 可以处理的有效模块。，输入输出都是字符串的形式。

plugin 通过监听会贯穿在整个生产过程的每个步骤，进行扩展

### 手写 loader / plugin

### bundle、chunck、module 的区别

我们书写的文件是一个个的 module，可以导出或被别的文件引用。

chunk 是由多个 module 合并成的，在 webpack 打包过程中，会根据引用依赖关系生成 chunk 文件。（entry、import() splitChunk 等）

处理完成后会输出 bundle 文件。一般来说一个 chunk 对应一个 bundle，但比如我们配置了 css 抽离插件，则会从 chunk 中单独抽离出一个 css bundle 文件。

### 前端模块化 & 模块包装
### （待补充实现原理）如何实现懒加载

import() 方法返回一个 promise，可以使用 /* webpackChunkName: "xxxx" */ 的形式来对打包后的文件命名。

### 热更新原理

### 构建过程

（核心是 Tapable 机制类似于 EventEmitter 的订阅分发系统）

读取文件配置，从入口文件开始执行编译。

按文件的类型，调用相应的 loader 对模版进行编译，转换成标准的JS代码。然后通过对JS代码的分析，收集其中的依赖关系，形成一颗关系树。在 `Webpack` 运行的生命周期中会广播出许多事件，`Plugin` 可以监听这些事件，在合适的时机通过`Webpack`提供的`API`改变输出结果。

webpack 根据入口文件和模块之间的依赖关系，会将代码包装成一个个 chunk，根据依赖和配置确定输出内容，这时仍可以通过 plugin 进行文件的修改。

最后根据 output 配置将文件内容写入到执行的文件夹中。

### dynamic import 的实现（jsonp）

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
      name: true, //每个缓存组打包得到的代码块的名称，为 true 时，会就key自动颜泽一个名称；为false时适用于生产环境，避免不必要的命名（此时打包结果通常为0.js、1.js）;如果为string，则会将缓存组打包成一个chunk，名称为该string
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

webpack默认使用TerserWebpackPlugin，默认开启多进程与缓存，可以在`.cache`中看到相关的文件。

#### 模块缓存

作为 dll 的替代方案，HardSourceWebpackPlugin为模块提供中间件缓存，配置相关插件后，第二次开始的构建时间会有很大程度上的缩减。

#### tree-shaking

依赖代码静态分析能力，用来清除代码中没有被使用到的部分。webpack 4 生产模式下自动开启。注意点是，能够去除的代码必须是 ES6 模块的，不能是 CommonJS 规范。而 Babel preset 会默认将任何模块类型都转译成 CommonJS 类型，因而导致 tree-shaking 失效，解决办法是设置 "module": false

#### 打包构建优化总结

+ 构建层
  + 多进程
    + happyPack
    + thread-loader
    + terser，多进程并行压缩
  + 缓存
    + HardSourceWebpackPlugin，有效提升第二次构建速度
    + dll
    + 大部分 `loader` 都提供了`cache` 配置项。比如在 `babel-loader` 中，可以通过设置`cacheDirectory` 来开启缓存，`babel-loader?cacheDirectory=true`。不支持 cache 配置的 loader 可通过 cache-loader 将编译写过写入缓存。
  + 压缩

+ 代码层
  + 作用域提升 scope hositing 将分散的模块划分到同一个作用域中。
  + 抽离第三方库、公共模块
  + 删除无用代码 tree-shaking

优化本身是一件拆东补西的事，比如提取出一个公共 chunk，打包产出的文件就会多一个，也必然会增加一个网络请求。当项目很庞大，每个公共模块单独提取成一个 chunk 会导致打包速度出奇的慢，影响开发体验，所以通常会取折衷方案，将重复的较大模块单独提取，而将一些重复的小模块打包到一个 chunk，以减少包数量，同时不能让这个包太大，否则会影响页面加载时间。

+ dll
+ tree-shaking
+ scope-hosting
+ code-splitting
+ happyPack 等
+ tree-shaking

### webpack 的缺点 （对比 bundleless）

[Webpack 打包太慢，试试 Bundleless](https://segmentfault.com/a/1190000023161176)

## Babel

### 基本配置

### 手写 plugin

### 运行机制

### babel-polyfill


babel-runtime 和 babel-polyfill 的区别