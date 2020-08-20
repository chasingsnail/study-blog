// var m = require("./moduleB.js");
// setTimeout(() => console.log(m), 3000)

const vm = require('vm')
var str = 'var m = new Date();module.exports = m;'
const funcWrap = ['function() {', '}'];

const result = funcWrap[0] + str + funcWrap[1]
console.log(result);







