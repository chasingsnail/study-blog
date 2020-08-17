;(function (self, factory) {
	if (typeof module === 'object' && typeof module.exports === 'object') {
		// CommonJS 规范环境
		module.exports = factory()
	} else if (typeof define === 'function' && define.amd) {
		// AMD 规范环境
		define(factory)
	} else {
		// 什么环境都不是，直接挂在全局对象上
		self.umdModule = factory()
	}
})(this, function () {
	return function () {
		return Math.random()
	}
})

