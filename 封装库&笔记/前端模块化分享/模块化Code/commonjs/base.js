// 获取 moduleA 文件的导出结果
const moduleA = require('./moduleA')

// 导出当前模块内 moduleA 的值
module.exports = moduleA

// index.js
require('./moduleA')
var m = require('./moduleB')
console.log(m)

// moduleA.js
var m = require('./moduleB')
setTimeout(() => console.log(m), 1000)

// moduleB.js
var m = new Date().getTime()
module.exports = m

// lib.js
var counter = 3
function increase() {
	counter++
}
module.exports = {
	counter: counter,
	increase: increase,
}

// main.js
var counter = require('./lib').counter
var increase = require('./lib').increase

console.log(counter) // 3
increase()
console.log(counter) // 3
