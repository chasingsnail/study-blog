# 基础

## 核心概念

+ entry：入口
+ output：输出
+ loader：模块转换器，把模块原有内容按需转换为新内容
+ Plugins：扩展，在构建流程中特定时期注入，来改变构建结果

## 初始化项目

```sh
# 项目初始化
npm init -y
# webpack 相关依赖
npm i webpack webpack-cli -D
```

入口文件默认为`src/index.js`。

## mode

webpack4增加mode配置项，告知webpack使用相应模式的内置优化。

| 选项        | 描述                                                         |
| ----------- | ------------------------------------------------------------ |
| development | 会将 `process.env.NODE_ENV` 的值设为 `development`。启用 `NamedChunksPlugin` 和 `NamedModulesPlugin`。 |
| production  | 会将 `process.env.NODE_ENV` 的值设为 `production`。启用 `FlagDependencyUsagePlugin`, `FlagIncludedChunksPlugin`, `ModuleConcatenationPlugin`, `NoEmitOnErrorsPlugin`, `OccurrenceOrderPlugin`, `SideEffectsFlagPlugin` 和 `UglifyJsPlugin`. |

## entry

入口文件设置，可以是字符串、数组或对象。

```js
module.exports = {
    entry: './src/index.js' //webpack的默认配置
}
```

## output

出口配置，控制webpack输出编译文件。

```js
const path = require('path');
module.exports = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'), // 绝对路径
        filename: 'bundle.[hash:6].js',
        publicPath: '/'
    }
}
```

其中，publicPath可以为CDN文件或资源目录，如线上地址为http://www.test.com/project'，则publickPath需设置为`/project`。

## loader

loader 用于对模块的源代码进行转换。loader 可以使你在 `import` 或"加载"模块时预处理文件。

*loader* 让 webpack 能够去处理那些非 JavaScript 文件（webpack 自身只理解 JavaScript）。loader 可以将所有类型的文件转换为 webpack 能够处理的有效[模块](https://www.webpackjs.com/concepts/modules)，然后你就可以利用 webpack 的打包能力，对它们进行处理。

loader配置在module.rules中，其中rules时一个数组，常用的配置格式为：

```js
{
  test: /\.js/, // 匹配规则
  use: 'babel-loader',
  exclude: /node_modules/
}
```

其中tes字段为文件匹配规则，use字段指定使用的loader，exclude（include）忽略（指定）匹配目录

use有多种写法：

+ 字符串： `use: 'babel-loader'`

+ 对象：

  ```js
  {
  	test: /\.js/,
    use: {
      loader: 'babel-loader',
      options: {
        presets: ["@babel/preset-env"]
      }
    }
  }
  ```

+ 数组： `use: ['style-loader', 'css-loader']`。使用数组时，每一项即可是字符串，也可是对象形式。其中，loader的执行顺序是**从右至左**

### babel-loader

将JS代码转换为低版本兼容代码。

#### 依赖包

```shell
npm i babel-loader -D
npm i @babel/core @babel/preset-env @babel/plugin-transform-runtime -D
npm install @babel/runtime @babel/runtime-corejs3
```

#### 配置

如上所示。

同时需要创建`.babelrc`文件对babel进行相关配置：

```js
{
    "presets": ["@babel/preset-env"],
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

该配置也可写在use.options中。

### 处理样式文件相关loader

webpack无法直接处理css相关文件，需要借助不同的loader。

#### 常用依赖

+ style-loader：动态创建style标签，将css插入head中
+ css-loader：负责处理@import、url()等语句
+ postcss-loader与autoprefixer，自动生成浏览器兼容前缀
+ Less-loader/sass-loader，负责处理sass、less文件，转换为css

#### 配置

```js
//webpack.config.js
module.exports = {
    //...
    module: {
        rules: [
            {
                test: /\.(le|c)ss$/,
                use: ['style-loader', 'css-loader', {
                    loader: 'postcss-loader',
                    options: {
                        plugins: function () {
                            return [
                                require('autoprefixer')({
                                    "overrideBrowserslist": [
                                        ">0.25%",
                                        "not dead"
                                    ]
                                })
                            ]
                        }
                    }
                }, 'less-loader'],
                exclude: /node_modules/
            }
        ]
    }
}
```

其中autoprefixer浏览器兼容规则通常写在根目录下`.browserslistrc`文件中。该文件可供除autoprefix外的babel、stylelint、eslint等插件使用。

### 图片、字体文件相关loader

#### 依赖

使用url-loader与file-loader。其中，file-loader为前者的peerDependencies。需要同时安装两者。

#### 配置

```js
module.exports = {
    //...
    modules: {
        rules: [
            {
                test: /\.(png|jpg|gif|jpeg|webp|svg|eot|ttf|woff|woff2)$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 10240 // 小于 10K 转换为 base64，减少网络请求
                        }
                    }
                ],
                exclude: /node_modules/
            }
        ]
    }
}
```

## plugins

数组形式配置于plugins字段中，如下：

```js
{
  plugins: [
    new Plugin1(),
    new Plugin2()
  ]
}
```

### html-webpack-plugin（结合html页面）

将打包构建后的入口文件自动注入html页面文件中。

```js
const HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = {
    //...
    plugins: [
        //数组 放着所有的webpack插件
        new HtmlWebpackPlugin({
            template: './public/index.html',
            filename: 'index.html', //打包后的文件名
            minify: {
                removeAttributeQuotes: false, //是否删除属性的双引号
                collapseWhitespace: false, //是否折叠空白
            },
            // hash: true //是否加上hash，默认是 false
        })
    ]
}
```

运行npx webpack命令后，可看到在dist目录下新增了index.html文件，并自动插入了script脚本。

同时，我们还可以传入config插件，支持自定义配置模板。由此，可以在模板中通过传入的config项控制代码加载与否。

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title><%= (htmlWebpackPlugin.options.config.title) %></title>
  </head>
  <body>
    <% if(htmlWebpackPlugin.options.config.header) { %>
    <div>Header： 测试环境可见11</div>
    <% } %>
    <div>hello webpack12</div>
    <button id="btn">async import</button>
    <i class="icon-plus"></i>

    <script src="./js//demo.js"></script>
  </body>
</html>
```

### clean-webpack-plugin(打包前清空)

每次打包前清空output输出目录。

```js
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
    //...
    plugins: [
        new CleanWebpackPlugin({
          cleanOnceBeforeBuildPatterns:['**/*', '!dll', '!dll/**'] // 不删除dll目录下的文件
        }) 
    ]
}
```

其中，可传入配置项`cleanOnceBeforeBuildPatterns`忽略删除指定文件。

## devServer

webpack-dev-server会启动一个本地服务，使得能够在浏览器中实时查看到展示效果。首先需要修改package.json文件中的配置。

```json
{
  "script": {
    "dev": "cross-env NODE_ENV=development webpack-dev-server"
  }
}
```

同时需要配置webpack.config.js

```js
module.exports = {
  devServer: {
    port: '8080'
  }
}
```

启动后就能够在`localhost:8080`中看到页面效果。

## devtool

该设置可以将编译后的代码映射回源代码，便于调试。通常开发模式下使用`cheap-module-eval-source-map`。生产环境可使用none或source-map。

相关参考值

| devtool                        | 构建速度 | 重新构建速度 | 生产环境 | 品质(quality)          |
| ------------------------------ | -------- | ------------ | -------- | ---------------------- |
| (none)                         | +++      | +++          | yes      | 打包后的代码           |
| eval                           | +++      | +++          | no       | 生成后的代码           |
| cheap-eval-source-map          | +        | ++           | no       | 转换过的代码（仅限行） |
| cheap-module-eval-source-map   | o        | ++           | no       | 原始源代码（仅限行）   |
| eval-source-map                | --       | +            | no       | 原始源代码             |
| cheap-source-map               | +        | o            | no       | 转换过的代码（仅限行） |
| cheap-module-source-map        | o        | -            | no       | 原始源代码（仅限行）   |
| inline-cheap-source-map        | +        | o            | no       | 转换过的代码（仅限行） |
| inline-cheap-module-source-map | o        | -            | no       | 原始源代码（仅限行）   |
| source-map                     | --       | --           | yes      | 原始源代码             |
| inline-source-map              | --       | --           | no       | 原始源代码             |
| hidden-source-map              | --       | --           | yes      | 原始源代码             |
| nosources-source-map           | --       | --           | yes      | 无源代码内容           |

T> `+++` 非常快速, `++` 快速, `+` 比较快, `o` 中等, `-` 比较慢, `--` 慢

# 进阶

## 静态资源拷贝：copy-webpack-plugin

有时候我们需要使用一些已有的JS本地文件，例如Vue项目中存放在Public文件夹下的静态文件。针对这类文件不需要进行编译，打包时直接将其拷贝至打包目录即可。

使用CleanWebpackPlugin插件。

```js
const CopyWebpackPlugin = require('copy-webpack-plugin');
module.exports = {
    //...
    plugins: [
        new CopyWebpackPlugin([
            {
                from: 'public/js/*.js',
                to: path.resolve(__dirname, 'dist', 'js'),
                flatten: true,
            },
          	{
              ignore: ['test.js'] // 忽略拷贝文件
            }
        ])
    ]
}

```

flatten的作用在于是否只拷贝文件，配置为false时，会将文件目录拷贝至目标文件(`dist/js/public/js`)。

## 抽离CSS：mini-css-extract-plugin

有时候会存在打包的JS文件过大，影响加载速度，这时候可以将css文件从中抽离出来单独打包。（开发环境一般无需抽离）

使用`mini-css-extract-plugin`插件

```js
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
module.exports = {
    plugins: [
        new MiniCssExtractPlugin({
            filename: 'css/[name].css'
            //个人习惯将css文件放在单独目录下
            //publicPath:'../'   //如果你的output的publicPath配置的是 './' 这种相对路径，那么如果将css文件放在单独目录下，记得在这里指定一下publicPath 
        })
    ]
}
```

此时，需要将rules中的style-loader替换为`MiniCssExtractPlugin.loader`。

```js
module.exports = {
    rules: [
        {
            test: /\.(c|le)ss$/,
            use: [
                {
                    loader: MiniCssExtractPlugin.loader,
                    options: {
                        hmr: true,
                        reloadAll: true,
                    }
                },
                //...
            ],
            exclude: /node_modules/
        }
    ]
}
```

## 压缩CSS：optimize-css-assets-webpack-plugin

webpack5自动开启css压缩，webpack4需手动开启。

```js
const OptimizeCssPlugin = require('optimize-css-assets-webpack-plugin');
module.exports = {
    //....
    plugins: [
        new OptimizeCssPlugin()
    ],
}
```

## 按需加载

webpack提供了import()语法，例如Vue-Router配置中的路由懒加载实现。

当遇到`import()` 语法时，会以该文件为入口生成一个新的chunk，当执行到该语句时，才会加载对应的文件。可以通过浏览器Network面板中观察到。

## 热更新

首先配置devServer中的hot为true，再者需配置相关的plugin。

```js
const webpack = require('webpack')
module.exports = {
  // ...
  devServer: {
    hot: true
  },
  plugins: [
    // ...
    new webpack,HotModuleReplacementPlugin()
  ]
}
```

当有代码被修改时，整个页面会被刷新。Vue中的热更新为局部热更新，即不刷新页面局部刷新，通过vue-loader实现。

## 区分不同环境

通常开发环境与生产环境的打包构建配置时不同的，此时我们可以准备三份配置：

+ base.js 基础通用配置
+ dev.js 开发环境配置
+ prod.js 生产环境配置

插件`webpack-merge`提供了merge方法，借由该方法可将两份webpack配置合并。

```js
const merge = require('webpack-merge')
const baseConf = require('./webpack.conf.base.js')
module.exports = merge(baseConf, {
  mode: 'development',
  // ....
})
```

除了merge方法外，也可以使用`merge.smart`方法，其在合并loader时，会将同一匹配规则进行合并。

## 定义环境变量

通常我们会通过webpack定义环境变量，例如process.env.NODE_ENV = 'development'，来区分开发环境与生产环境。这里使用webpack内置`DefinePlugin`来定义环境变量。

```js
const webpack = require('webpack')
module.exports = {
  // ...
  plugins: [
    new webpack.DefinePlugin({
      Flag: 'true' // boolean类型
    })
  ]
}
```

其中，value如果是字符串，会被当作code来处理。

## 代理配置

联调接口时，需将本地请求转发至线上环境，可通过配置devServer.proxy来实现。

```js
module.exports = {
  // ...
  devServer: {
    proxy: {
      '/api': {
        target: 'http://test.online.com',
        pathRewrite: {
          '/api': ''
        }
      }
    }
  }
}
```

此时可将本地请求baseURL配置为'/api'，此时所有接口会被转发至target配置域名，同时不保留'/api'前缀。

# 优化

## （？）exclude/include

通过该配置来精确转译文件的范围，exclude：排除文件；include：指定包含文件。

exclude优先级高于include。

## cache-loader

缓存loader编译结果至磁盘中，其自身缓存或读取文件会有一些开销，因此用于开销较大的loader之前。

## （实际应用情况？）happypack

webpack运行时为单线程模型，一次只能处理一个文件，无法并行处理。happypack可以嫁给你任务拆解为多个子进程，最后再将结果汇总到主进程。

利用CPU多核能力，提升构建速度。默认开启`CPU核数 - 1`个进程，也可通过threads参数传递开启进程数。

```js
const Happypack = require('happypack');
module.exports = {
    //...
    module: {
        rules: [
            {
                test: /\.js[x]?$/,
                use: 'Happypack/loader?id=js',
                include: [path.resolve(__dirname, 'src')]
            },
            {
                test: /\.css$/,
                use: 'Happypack/loader?id=css',
                include: [
                    path.resolve(__dirname, 'src'),
                    path.resolve(__dirname, 'node_modules', 'bootstrap', 'dist')
                ]
            }
        ]
    },
    plugins: [
        new Happypack({
            id: 'js', //和rule中的id=js对应
            //将之前 rule 中的 loader 在此配置
            use: ['babel-loader'] //必须是数组
        }),
        new Happypack({
            id: 'css',//和rule中的id=css对应
            use: ['style-loader', 'css-loader','postcss-loader'],
        })
    ]
}
```

## thread-loader

除了happypack外，webpack4官方推荐，提供了thread-loader的解决方案。用法是将thread-loader放置在其他loader之前，放置在其后的loader就会单独在一个worder池中运行。

worker池中有相应的限制：

+ 无法产生新文件
+ 无法定制loader API
+ 无法获取webpack传入选项配置
+ 每个单独进程处理时间上限为600ms

**在开销大的loader中使用**，例如babel-loader。

防止启动 worker 的高延迟，可进行预热的优化措施。

```js
const threadLoader = require('thread-loader')

const jsWorkerPool = {
  worker: 2, // 默认为 CPU核数 - 1
  poolTimeout: 2000 // 闲置时删除进程，默认为5000ms
}
// 预热
threadLoader.warmup(jsWorkderPool, ['babel-loader'])

module.exports = {
  module: {
    rules: [
      test: /\.js$/,
      use: [
      	{
      		loader: 'thread-laoder',
      		options: jsWorkerPool
      	},
  			'babel-loader'
    	]
    ]
  }
}
```

## JS多进程压缩

webpack默认使用TerserWebpackPlugin，默认开启多进程与缓存，可以在`.cache`中看到相关的文件。

## 模块缓存

作为 dll 的替代方案，HardSourceWebpackPlugin为模块提供中间件缓存，配置相关插件后，第二次开始的构建时间会有很大程度上的缩减。

相比于 dll 较为繁琐的配置，HardSourceWebpackPlugin仅需要引入即可。

```js
var HardSourceWebpackPlugin = require('hard-source-webpack-plugin');
module.exports = {
    //...
    plugins: [
        new HardSourceWebpackPlugin()
    ]
}
```

## noParse

接受正则表达式或一个function。

用于指定某些没有AMD/CommonJS规范的模块直接被webpack不进行转化与解析直接被引入。

## 抽离公共代码

该配置目的在于抽离出多次引用的公共代码，抽离出来单独打包，后续的引用直接读取缓存而不需要重复下载。

配置在optimization.splitChunks中

```js
module.exports = {
    optimization: {
        splitChunks: {
            cacheGroups: {
                vendor: {
                    // 第三方依赖
                    priority: 1, //设置优先级，首先抽离第三方模块
                    name: 'vendor',
                    test: /node_modules/,
                    chunks: 'initial',
                    minSize: 0,
                    minChunks: 1 //最少引入了1次
                },
                // 缓存组
                common: {
                    // 公共模块
                    chunks: 'initial',
                    name: 'common', // 打包文件名
                    minSize: 100, // 大小超过100个字节
                    minChunks: 3 // 最少引入了3次
                }
            }
        }
    }
}
```

## Tree-shaking



# 原理

# 参考文章

## 优化
+ [Vue打包优化之路](https://zhuanlan.zhihu.com/p/48461259)
+ [玩转 webpack，使你的打包速度提升 90%](https://juejin.im/post/5e53dbbc518825494905c45f)
+ [如何使用Tree-shaking减少代码构建体积](https://juejin.im/post/5e54d5e7e51d4526c932b60f)
## 原理
+ [Webpack HMR 原理解析](https://zhuanlan.zhihu.com/p/30669007)
+ [如何使用 splitChunks 精细控制代码分割](https://juejin.im/post/5e7c83b4e51d455c6c269608)
+ [为美好的世界献上 Hot Reload](https://zhuanlan.zhihu.com/p/62381114)
+ [Webpack 是怎样运行的?（一）](https://zhuanlan.zhihu.com/p/52826586)
+ [手摸手，带你用合理的姿势使用webpack4（上）](https://juejin.im/post/5b56909a518825195f499806)
+ [你的Tree-Shaking并没什么卵用](https://zhuanlan.zhihu.com/p/32831172)
+ [Webpack 中的 sideEffects 到底该怎么用？](https://zhuanlan.zhihu.com/p/40052192)
+ [webpack打包原理 ? 看完这篇你就懂了 !](https://juejin.im/post/5e116fce6fb9a047ea7472a6)
## 综合
+ [再来一打Webpack面试题(持续更新)](https://juejin.im/post/5e6f4b4e6fb9a07cd443d4a5)
