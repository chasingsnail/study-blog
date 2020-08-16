// index.js
require(['moduleA', 'moduleB'], function (moduleA, moduleB) {
	console.log(moduleB)
})

// moduleA.js
define(['./moduleB'], function (moduleB) {
  setTimeout(() => {
    console.log(moduleB);
  }, 1000)
})

// moduleB.js
define(function (require) {
	var m = new Date().getTime()
	return m
})
