## Webpack

### 为什么使用，解决了什么问题

代码层面

+ 通过对代码的压缩，拆分，减小代码体积，加载更快
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

import() 方法返回一个 promise

### 热更新原理

### 构建过程

（核心是 Tapable 机制类似于 EventEmitter 的订阅分发系统）

读取文件配置，从入口文件开始执行编译。

按文件的类型，调用相应的 loader 对模版进行编译，转换成标准的JS代码。然后通过对JS代码的分析，收集其中的依赖关系，形成一颗关系树。在 `Webpack` 运行的生命周期中会广播出许多事件，`Plugin` 可以监听这些事件，在合适的时机通过`Webpack`提供的`API`改变输出结果。

webpack 根据入口文件和模块之间的依赖关系，会将代码包装成一个个 chunk，根据依赖和配置确定输出内容，这时仍可以通过 plugin 进行文件的修改。

最后根据 output 配置将文件内容写入到执行的文件夹中。

### 按需加载的实现

### dynamic import 的实现（jsonp）

### 优化

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