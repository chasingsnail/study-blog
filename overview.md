# 知识点

## Javascript

+ this/call/apply/bind （完成）
    + 介绍JS中的this
    + 如何改变this指向
    + 手写call、bind、apply等，注意各自实现的区别。
    + call与apply的区别
+ 原型与继承（高程第六章）（完成）
		+ 原型与原型链、`prototype` 与 `__proto__`
    + 模拟 new 的实现（结合手写 bind 中维护原型关系）
    + 继承 
      + ES5多种继承方式的优劣
      + ES6 class extends 继承
      + 二者区别
      + constructor 的重写
+ 执行上下文、作用域与作用域链、闭包	(完成)
		+ JS的执行上下文
		+ 作用域连（要到创建这个函数的那个作用域中取值——是“创建”，而不是“调用”）
    	+ 函数的生命周期
    	+ 变量与函数的声明 （提升）
    	+ Activetion Object（AO）、Variable Object（VO）
		+ 闭包
    	+ 使用场景及使用不当导致的问题（垃圾回收问题）
    	+ 高阶函数应用（柯里化）
+ 异步（完成）
    + promise
    	+ Promise 基本用法，了解各规范（Promise A+等） （wfp 文章）
    	+ 实现一个Promise 
    	+ 手写 all、once、finally 方法
    + async与await，及其内部实现原理（generator）
+ Event Loop（完成）
		+ 什么是事件循环 
    + 宏任务、微任务
    + 结合setTimeout、异步等判断执行顺序
    + Node与浏览器中Event loop的不同
    + 结合Vue中$nextTick
+ 类型（结合 你不知道的js）
    + 类型简述
    + 类型的判断
    + 类型转换
    + == 与 === 机制的原理 （toPrimitive）
+ 模块化（结合webpack看）
    + amd、cmd、commonjs、import
    + module.exports和exports区别
    + Vue单文件打包后的引入
+ 跨域
    + 同源策略
    + 跨域方式
    + 前端代理方式
+ 正则表达式
+ 事件
		+ DOM事件流（结合高程中DOM部分）
    + 事件机制
    + 委托
    + 浏览器兼容（通用事件侦听函数）
+ 工具函数
    + 防抖与节流  原理与应用场景
    + 数组扁平化
+ 浏览器渲染过程
    + 渲染机制
    + 回流（重排）、重绘（mooc性能优化）
    + GPU加速
    + 什么时候会阻塞DOM渲染
    + 从url输入到页面展示
    + 浏览器缓存
+ ES6/ES7/ES8的特性
    + map、weakMap
    + proxy
    + Iterator
+ 垃圾回收机制
+ 线程与进程
+ 函数式编程
+ 尾递归
+ 设计模式
+ WebSocket
+ 鉴权
    + cookie、session

# 链接

[2020年前端面试复习必读文章【超百篇文章/赠复习导图】](https://juejin.im/post/5e8b163ff265da47ee3f54a6)

## 综合（结合掘金 面试&梳理 收藏夹以及点赞文章）

+ [中高级前端面试题（万字长文）](https://juejin.im/post/5e4c0b856fb9a07ccb7e8eca )

+ [大前端面试题库](http://bigerfe.com/)

+ [174道题](https://segmentfault.com/a/1190000022164672)

+ [2万字 | 前端基础拾遗90问](https://juejin.im/post/5e8b261ae51d4546c0382ab4)

+ [2019面试准备](https://juejin.im/post/5c8e4cd3f265da67c87454a0)

+ [前端高频面试题及答案汇总](https://juejin.im/post/5c6977e46fb9a049fd1063dc)

+ [前端面试总结](https://juejin.im/post/5befeb5051882511a8527dbe)

+ [面试分享：两年工作经验成功面试阿里P6总结](https://juejin.im/post/5d690c726fb9a06b155dd40d)

  

## HTML

## CSS

### 综合

+  [挑战一轮大厂后的面试总结 (含六个方向) - css 篇](https://juejin.im/post/5e59deb0518825494e278549 )
+ [CSS知识点面试总结](https://juejin.im/post/5e53cefbf265da57570475a7)
+ [一文说清浏览器解析与CSS动画优化](https://segmentfault.com/a/1190000008015671)

## JavaScript

### 综合

+  [挑战一轮大厂后的面试总结 (含六个方向) - javascript 篇(万字长文)](https://juejin.im/post/5e523e726fb9a07c9a195a95 )

### ES6

+  [《大前端吊打面试官系列》 之 ES6 精华篇（2020年）](https://juejin.im/post/5e4943d0f265da57537eaba9#comment) 

### 原型

+ [深入理解javascript原型和闭包系列](https://www.cnblogs.com/wangfupeng1988/p/4001284.html)

### 事件循环

+  [面试题：说说事件循环机制(满分答案来了)](https://juejin.im/post/5e5c7f6c518825491b11ce93 )
+  [最后一次搞懂Event Loop](https://juejin.im/post/5cbc0a9cf265da03b11f3505)
+  [Event Loop、计时器、nextTick](https://juejin.im/post/5ab7677f6fb9a028d56711d0)

### 异步

+ [Promise 中的三兄弟 .all(), .race(), .allSettled()](https://segmentfault.com/a/1190000020034361)
+ [你能手写一个Promise吗](https://juejin.im/post/5c41297cf265da613356d4ec)
+ [JS 高级之手写一个Promise,Generator,async和 await【近 1W字】](https://juejin.im/post/5df83b93f265da33f8652ccc)

### 模块化（webpack打包基础）

+ [前端模块化详解(完整版)](https://juejin.im/post/5c17ad756fb9a049ff4e0a62)
+ [前端工程师必备：前端的模块化](https://juejin.im/post/5cb004da5188251b130c773e)
+ [require时，exports和module.exports的区别你真的懂吗?](https://juejin.im/post/5d5639c7e51d453b5c1218b4)

### 正则

+ [正则表达式不要背](https://juejin.im/collection/58b1062b6a22657a3869862f)
+ [前端为什么要会正则](https://zhuanlan.zhihu.com/p/57149231)

### 类型

+ [我对 JS 中相等和全等操作符转化过程一直很迷惑，直到有了这份算法](https://juejin.im/post/5d9fc461f265da5b5f757830)
+ [17道题彻底理解 JavaScript 中的类型转换](https://juejin.im/post/5d4999fff265da038f47f5c7)

### 缓存

+ [前端缓存最佳实践](https://juejin.im/post/5c136bd16fb9a049d37efc47)

### 浏览器渲染

[从浏览器多进程到JS单进程渲染](https://juejin.im/post/5a6547d0f265da3e283a1df7)

[浏览器的回流与重绘](https://juejin.im/post/5a9923e9518825558251c96a)

## 框架

### Vue

+ 响应式原理
  
  + `Vue`大
  
+ Computed的实现
  1. [Vue 的计算属性真的会缓存吗？（保姆级教学，原理深入揭秘）](https://juejin.im/post/5e8fd7a3f265da47c35d7d29)
  2. fs sf
  
+ Vue3
  + [Vue3 的响应式和以前有什么区别，Proxy 无敌？](https://juejin.im/post/5e92d863f265da47e57fe065)
  + [细致分析，尤雨溪直播中提到 vue3.0 diff 算法优化细节](https://juejin.im/post/5e9ee8a6f265da47b27da28c)
  
+ 相关题目
  
  +  [【吐血整理】前端面试全攻略，为您保驾护航，🤑金三银四🤑不在话下](https://segmentfault.com/a/1190000022265710)
  
  + [2020年大厂面试指南 - Vue篇](https://juejin.im/post/5e4d24cce51d4526f76eb2ba)
  
  + [为什么Vue中不要使用index作为key](https://juejin.im/post/5e8694b75188257372503722)
  
  + [想用Vuejs突破20K必备的热门面试题](https://juejin.im/post/5e6b414bf265da574657ec6d)
  
  + [12道高频原理面试题](https://juejin.im/post/5e04411f6fb9a0166049a073)
  
  + [30 道 Vue 面试题，内含详细讲解（涵盖入门到精通，自测 Vue 掌握程度）](https://juejin.im/post/5d59f2a451882549be53b170)
  
  + [在阿里我是如何当面试官的（持续更新）](https://juejin.im/post/5e6ebfa86fb9a07ca714d0ec)
  
  + 

### React

### Diff

+ [key的作用](https://zhuanlan.zhihu.com/p/59619074)

## CSS

+ [26个css高频考点](https://juejin.im/post/5e8fb5b16fb9a03c464934a8)

## Node

### path

+ [作为一个前端工程师也要掌握的几种文件路径知识](https://juejin.im/post/5d1a3328e51d4510727c80e4)

### stream

### 项目工程化应用

+ [加快Vue项目的开发速度](https://juejin.im/post/5c106485e51d450e657571a6)

### 框架

+ Koa
  + 洋葱模型

### 综合

+  [挑战一轮大厂后的面试总结 (含六个方向) - nodejs 篇](https://juejin.im/post/5e53cf886fb9a07c91101642 )

## 工具（链）

### Webpack

+ [2020年了,再不会webpack敲得代码就不香了](https://juejin.im/post/5de87444518825124c50cd36)
+ 掘金Node收藏夹

+ 优化
  + [玩转 webpack，使你的打包速度提升]( https://juejin.im/post/5e53dbbc518825494905c45f )
  + [SplitChunksPlugin 私房菜](https://juejin.im/post/5edd942af265da76f8601199)

### Babel

+  [读完这篇你还不懂Babel我给你寄口罩](https://juejin.im/post/5e477139f265da574c566dda )
+ [不容错过的 Babel7 知识](https://juejin.im/post/5ddff3abe51d4502d56bd143)

## 安全

+  [前端鉴权相关](https://juejin.im/post/5e8c19f86fb9a03c412c01d1)

## 网络

### TCP相关

+  [TCP协议灵魂之问，巩固你的网路底层基础](https://juejin.im/post/5e527c58e51d4526c654bf41 )
+  [如何优雅的谈论HTTP／1.0／1.1／2.0](https://www.jianshu.com/p/52d86558ca57)

### 综合

+  [2020年大厂面试指南-网络篇](https://juejin.im/post/5e44e17a518825491b11bd63 )
+  [前端需要了解的计算机网络知识， 这一篇就够了](https://juejin.im/post/5e51febde51d4526c932b390 )（了解）

## 算法

树，栈，队列等，中等、低难度为主

## 性能优化

可以从四个层面复习，分别从网络资源优化，HTTP 请求层面的优化，JS 优化，渲染层面的优化展开

## 项目

+ 木牛第三方接入页面问题，是否可以调整为多页面打包
+ JSON schema 配置型表单 （深入优化的部分？）
  + 是否可以拆成独立依赖包？
  + 是否需要兼容多UI库？
  + 不同项目中主题定制是否方便？
  + 是否有可优化配置的点？
+ 木牛重构（结合设计模式等等？）

## 简历

+ [教你如何写初/高级前端简历【赠简历导图】](https://juejin.im/post/5e91a0a4518825739837bf84)