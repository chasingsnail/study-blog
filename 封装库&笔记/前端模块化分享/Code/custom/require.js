const vm = require('vm')
const path = require('path')
const fs = require('fs')

function customRequire(modulePath) {

  let content = fs.readFileSync(path.resolve(__dirname, modulePath), 'utf-8')

  const funcWrapper = ['(function(require, module, exports) {', '})']
  
	content = funcWrapper[0] + content + funcWrapper[1]

	const script = new vm.Script(content)
	const func = script.runInThisContext()
	const m = {
		exports: {},
	}
	console.log('m is', m);
	func(customRequire, m, m.exports)
	return m.exports
}

global.customRequire = customRequire

// module.exports = xx
// exports.xx = xx

// exports = xx
