## 实现类似 Webpack alias 功能

### 全局变量

在 app 增加

```js
global.module_base = __dirname + '/modules'
```

### Hack require

```js
global.moduleRequire = function(name) {
  return require(__dirname + '/modules' + name)
}
```

### 环境变量

设置 NODE_PATH。

NODE_PATH中的路径被遍历是发生在从项目的根位置递归搜寻 `node_modules` 目录，直到文件系统根目录的 `node_modules`，如果还没有查找到指定模块的话，就会去`NODE_PATH中注册的路径中查找`。