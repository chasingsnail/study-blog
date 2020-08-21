var nums = [1, 1, 1, 0]
var target = 3
// result = 2 (-1 + 2+ 1)

let threeSumClosest = function (nums, target) {
  let minGap
  let result
  // let finded = false
  nums = nums.sort((a, b) => a - b)
  for (let i = 0; i < nums.length - 2; i++) {
    // if (finded) break
    let startIndex = i + 1
    let endIndex = nums.length - 1
    while (startIndex < endIndex) {
      const sum = nums[i] + nums[startIndex] + nums[endIndex]
      const gap = Math.abs(target - sum)
      if (!minGap) {
        result = sum
        minGap = gap
      } else {
        if (gap < minGap) {
          result = sum
          minGap = gap
        }
      }
      // minGap = minGap ? Math.min(minGap, gap) : gap
      if (sum > target) {
        endIndex--
      } else if (sum < target) {
        startIndex++
      } else {
        return sum
        // finded = true
        // break
      }
    }
  }
  return result
}
var result = threeSumClosest(nums, target)
console.log(result)
