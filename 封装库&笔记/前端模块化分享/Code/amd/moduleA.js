define(['./moduleB'], function (moduleB) {
  setTimeout(() => {
    console.log(moduleB.m);
  }, 1000)
})