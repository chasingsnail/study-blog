## 背景

**抽象语法树**，源代码语法结构的一种抽象表示，以树状的形式表现语言结构

运用：

+ 高级语言的编译 、机器码的生成
+ 编译器的错误提示、高亮、自动补全代码
+ 前端领域： eslint、pretiier 代码风格检查；babel、ts 代码编译处理

## babel 插件

### 处理步骤

Babel 编译代码的过程可分为三个阶段：解析（parsing）、转换（transforming）、生成（generating），这三个阶段分别由 @babel/parser、@babel/core、@babel/generator 执行。

