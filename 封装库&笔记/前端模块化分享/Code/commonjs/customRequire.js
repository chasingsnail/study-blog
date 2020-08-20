const path = require('path')
const fs = require('fs')
const vm = require('vm')

function customRequire(modulePath) {
  const codeStr = fs.readFileSync(
    path.join(__dirname, modulePath),
    'utf-8'
  )

  const funcWrap = ['(function(require, module, exports) {', '})']
  // const codeStr = 'var m = new Date().getTime();module.exports = m;'

  const result = funcWrap[0] + codeStr + funcWrap[1]

  const script = new vm.Script(result);

  const func = script.runInThisContext()

  const m = {
    exports: {},
  }
  func(customRequire, m, m.exports)
  return m;
  // console.log(m)
}

global.customRequire = customRequire