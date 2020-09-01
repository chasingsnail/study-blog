

async function async1() {
  console.log('async1 start')
  await async2()
  await async3()
  console.log('async1 end')
}
async function async2() {
  console.log('async2 start')
  await async3()
  console.log('async2 end')
}
async function async3() {
  console.log('async 3');
}
console.log('script start')
setTimeout(function() {
  console.log('setTimeout')
}, 0)
async1()
console.log('end')