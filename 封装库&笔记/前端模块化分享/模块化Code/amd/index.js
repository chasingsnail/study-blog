require(['moduleA', 'moduleB'], function (moduleA, moduleB) {
  console.log(moduleB.m)
  moduleB.incM();
  console.log(moduleB.m)
})
