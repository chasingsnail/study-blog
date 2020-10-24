## 定位

模块打包工具，符合 ES Module 规范。

## 打包后显示信息

![image-20200416223828659](/Users/mac/Library/Application Support/typora-user-images/image-20200416223828659.png)

chunks、chunk name 相当于bundle的ID和name。

其中main表示文件入口。

## entry

打包入口

```js
// 单文件
module.exports = {
  entry: './src/index/js'
  // 等价于 
  // entry: {
  //   main: './src/index/js'
	// }
}

// 多入口,此时 output filename 不能配置为固定文件名
module.exports = {
  entry: {
    main: './src/index/js',
    sub: './src/index/js'
  }
}
```

## output 

输出文件配置

```js
module.exports = {
  output: {
    // 资源路径
    publicPath: 'http://cdn.com/'
    chunkFileName: '[name].[contenthash].js', // 间接生成的文件 文件名
    filename: '[name].[contenthash].js' // 入口文件名
  }
}
```

通常生产环境打包会配置contenthash。

## loader

### 处理样式文件

#### style-loader

将css通过style标签添加进html中。通常搭配css-loader使用。

#### css loader

正确识别@import、url()等方法，将 css 转化为 CommonJs 模块

+ 启用css模块设置

```js
// index.js
import style from './index.scss'
// import './index.scss'

// webpack.config.js
{
  modules: true
}
```

#### sass-loader

将 Sass 编译为 css，默认使用 node Sass

### 处理文件：图片、字体等

#### file-loader

可以将 import / require() 方式倒入的文件转化为一个 url 并输出至 output 目录。

+ name 配置可以设置输出的文件名格式，结合 placeholder 配置

```js
{
	options: {
		name: '[name]_[hash].[ext]'
	}
}
```

#### url-loader

在 file-loader 基础上，增加了 limit 配置，可以将限制尺寸内的图片转化为 base64 的形式，减少网络请求。

### 处理JS文件

#### （重要、待了解）babel-loader

 babel-loader @babel/core 依赖

@babel/polyfill 兼容低版本

```js
module.exports = {
  module: {
    rules: [
			{
				test: /\.js$/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: [['@babel/preset-env'], {
              target: {}, // 配置运行的浏览器版本，高版本可不转换
							userBuiltIns: 'usage' // 按需引入polyfill
						}]
					}
				}
			}
    ]
  }
}
```

针对polyfill：

+ 业务代码场景可仅配置 presets
+ 组件库维护需要用到 plugins - @babel/plugin-transform-runtime 来避免全局变量的污染，以闭包的形式注入

## plugins

### htmlWebpackPlugin

在打包结束后，自动生成一个 html 文件（也可以使用已有 html 文件），并把打包生成的 js 自动引入到 html 中。

```js
module.exports = {
  plugins: [
    new HtmlWebpackPlugins({
      template: 'src/index.html', // 选择已有文件模板
      filename: 'index.html' // 打包后的文件名
    })
  ]
}
```

### cleanWebpackPlugin

打包前清理 output 目录。

### css压缩

### webpack.ProvidePlugin (shimming)

```js
module.exports = {
	plugins: [
		new webpack.ProvidePlugin({
			'$': 'jquery', // $ -> jquery
      '_join': ['lodash', 'join'] // _join -> lodash.join
		})
	]
}
```

文件中使用了$时，webpack会自动引入jquery。

## （重要）HMR

页面中使用部分 js 模块热更新

```js
if (module.hot) {
  module.hot.accept(
  	dependencies, // 可以是一个字符串或字符串数组
  	callback // 用于在模块更新后触发的函数
	);
  // or
  module.hot.accept()
}
```

css-loader、vue-loader等 已经实现 HRM 功能 。

webpack 编译后将文件存放在内存中，原因在于：（基于 momory-fs）

+ 访问内存的代码比访问文件系统的文件快
+ 减少了代码写入文件的开销

参考文章

+ [Webpack HMR 原理解析](https://zhuanlan.zhihu.com/p/30669007)
+ [轻松理解webpack热更新原理](https://juejin.im/post/5de0cfe46fb9a071665d3df0)

## sourceMap

表示一个映射关系，能够维护打包文件对应的源码文件。

配置项实际由五个关键字自由组合：eval`，`source-map`，`cheap`，`module`，`inline。

| 关键字     | 作用                                                         |
| ---------- | ------------------------------------------------------------ |
| eval       | 使用eval包裹模块代码，不生成独立的.map文件。通过在每个模块末尾添加sourceURL作映射。效率最高。 |
| source-map | 生成独立的.map文件作映射。效率最低。                         |
| inline     | 会将生成的map文件转为base42编码嵌入打包文件中，不生成独立的map文件。 |
| cheap      | 生成的map文件不包含代码列数信息，仅定位到行。同时不包含loader错误。 |
| module     | 同cheap相比，会包含loader错误信息。                          |

生产环境配置参考：'cheap-module-source-map'、‘none’、‘source-map’

开发环境配置参考：'cheap-modul-eval-source-map'

### 参考文章

+ ##### [打破砂锅问到底：详解Webpack中的sourcemap](https://segmentfault.com/a/1190000008315937)

+ [JS SourceMap 详解](http://www.ruanyifeng.com/blog/2013/01/javascript_source_map.html)

## DevServer 

### 代码更新后三种自动编译方式

+ `webpack watch mode`：package.json 中 script 配置 `webpack --watch` （无法自动刷新浏览器）
+ webpack-dev-server （编译后将 bundle 文件保留在内存中）

```js
module.exports = {
  devServer: {
    open: true,
    port: 8080,
    publicPath: '/assets/', // 打包资源路径 http://localhost:8080/assets/app.js
    proxy: {
      // ...
    }
  }
}
```

+ webpack-dev-middleware + express/koa 使用Node环境起服务

+ ```js
  const webpack = require('webpack')
  const webpackDevMiddleware = require('webpack-dev-middleware')
  const express = require('express')
  const config = require('../webpack.config')
  const compiler = webpack(config)
  
  const app = express()
  
  app.use(webpackDevMiddleware(compiler))
  
  app.listen(3000, () => {
    console.log('server is running on port 3000');
  })
  ```

## Tree Shaking（仅支持 ES Module）

剔除没有用到的代码。

```js
// webpack.config.js
module.expors = {
	optimization: {
		minimize: true,
		usedExports: true,
		minimizer: [
			new TerserPlugin()
		]
	}
}

// package.json
{
  "sideEffects": false // 配置不需要tree shaking的文件，即无导出文件。可存放数组，例如["@babel/polyfill", "*.css"]
}
```

在`mode: production`条件下无需配置 `optimization.userdExports`，且source-map不能配有eval。

除了sideEffects中配置副作用文件，还可以在css相关的loader中将sideEffects设置为true。



## Code Splitting

问题背景：

+ 打包文件过大，加载时间过长
+ 基础依赖包几乎不改变，无需重新打包加载。

同步代码加载时 `import xx from 'xx'`，配置 optimization 即可。

```js
// basic use
module.exports = {
	optimization: {
		splitChunks: {
			chunks: 'all'
		}
	}
}
```

异步加载 `import()` 方法，无需配置optimization，打包时会自动被分割为单独文件（0.js）。可实现懒加载。该语法为EcmaScript语法，webpack能够识别。

### splitChunksPlugin 配置

webpack默认配置

```js
module.exports = {
  //...
  optimization: {
    runtimeChunk: { // 兼容旧版本无修改文件打包后仍会改变 contenthash问题
      name: 'runtime'
    }
    splitChunks: {
      chunks: 'async',
      minSize: 30000,
      maxSize: 0,
      minChunks: 1,
      maxAsyncRequests: 6,
      maxInitialRequests: 4,
      automaticNameDelimiter: '~',
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true
        }
      }
    }
  }
};
```

#### chunks

+ async：仅对异步加载的代码生效
+ all：同步与异步代码都做分割
+ initial: 仅对同步代码分割

#### minSize

生成chunk的最小体积（引入代码体积检测），需要大于该值才会作分割，默认30kb

#### maxSize

试图将chunk分割为更小的部分，至少为该值的大小。

#### minChunks

打包后的chunk中，模块被引用的最小次数

#### maxAsyncRequests

按需异步加载时最大并行请求数

#### maxInitialRequests

入口最大并行请求数

#### automaticNameDelimiter

打包文件名连接符

#### name

chunk名

#### cacheGroups

缓存组。缓存组中除了可以继承上述所有配置，还有自己独有的三个配置：

+ test 匹配模块
+ priority：打包优先级，若一个模块同时命中多个缓存组，则按该值最大优先
+ reuseExistingChunk：复用已生成的相同模块，不会产生新的chunck

该配置中，可能存在vendor包过大的情况。这时候可以考虑拆包，例如提取第三方库

```js
module.exports = {
  // ...
  optimization: {
    splitChunks: {
        chunks: 'all',
        cacheGroups: {
            "vue-vendors": {
                test: /vue/,
                name: 'vue-vendors'
            },
          	vendors: {
              test: /[\\/]node_modules[\\/]/,
          		priority: -10
            }
        }
    }
	}
}
```

### prefetch/preloading

```js
// 使用magic common
import(/* webpackPrefetch: true */ 'LoginModal');
```

打包后实际会生成 `<link rel="prefetch" href="login-modal-chunk.js">`放置于head中。

可以应用在首页中登录、注册的弹框组件。

+ preload 可以指明哪些资源是在页面加载完成后即刻需要的。希望资源在页面加载的生命周期的早期阶段就开始获取，在浏览器的主渲染机制介入前就进行预加载。不会阻塞 onload。例如应用在提前加载图片或字体文件等。
+ prefetch加载由浏览器控制，在空闲时刻加载未来可能会用到的资源。

## 打包文件分析

[webpack-bundle-analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)

# Library 打包

不同环境使用情况的打包 

```js
module.exports = {
  output: {
    // ...
    library: 'root', // 可以通过 script 标签引入，挂在到全局对象 library 上
    libraryTarget: 'umd' // 兼容 commonjs 与 AMD，还可填 window、this、global（Node环境）
  }
}
```

# Loader 编写

```js
module.exports = {
  	resolveLoader: {
			modules: ['node_modules', './loaders'] // loader 搜寻范围
		},
  	modules: {
      rules: [
        {
          test: /\.js$/,
          use: 'xxxLoader'
        }
      ]
    }
}
```

