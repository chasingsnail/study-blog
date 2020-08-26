// var nums = [1, 1, 1, 0]
// var target = 3
// // result = 2 (-1 + 2+ 1)
// // 双指针 求三数之和
// let threeSumClosest = function (nums, target) {
//   let minGap
//   let result
//   // let finded = false
//   nums = nums.sort((a, b) => a - b)
//   for (let i = 0; i < nums.length - 2; i++) {
//     // if (finded) break
//     let startIndex = i + 1
//     let endIndex = nums.length - 1
//     while (startIndex < endIndex) {
//       const sum = nums[i] + nums[startIndex] + nums[endIndex]
//       const gap = Math.abs(target - sum)
//       if (!minGap) {
//         result = sum
//         minGap = gap
//       } else {
//         if (gap < minGap) {
//           result = sum
//           minGap = gap
//         }
//       }
//       // minGap = minGap ? Math.min(minGap, gap) : gap
//       if (sum > target) {
//         endIndex--
//       } else if (sum < target) {
//         startIndex++
//       } else {
//         return sum
//         // finded = true
//         // break
//       }
//     }
//   }
//   return result
// }
// var result = threeSumClosest(nums, target)
// console.log(result)

const mockData = [5, 7, 9, 4, 10, 21, 3, 6]
// const mockData = [7, 5, 8, 4, 10, 11]

// 冒泡排序 好 O(n) 坏 O(n^2) 平均 O(n^2)
const bubbleSort = (arr, judge) => {
	for (let i = arr.length; i > 0; i--) {
		// const element = arr[i];
		for (let j = 0; j < i - 1; j++) {
			if (judge(arr[j], arr[j + 1])) {
				// 纯数字的情况
				;[arr[j + 1], arr[j]] = [arr[j], arr[j + 1]]
			}
		}
	}
	return arr
}

const judge = (a, b) => a > b

// 直接插入排序
const insertSort = arr => {
	for (let i = 1; i < arr.length; i++) {
		let temp = arr[i];
		// 从后往前
		let j
		for (j = i - 1; j >= 0; j--) {
			if (arr[j] > temp) {
				// 当数组项大于比较项时，将第 j 项往后的项往后移位
				arr[j + 1] = arr[j]
			} else {
				// 找到第一项小于比较项时，跳出循环
				break
			}
		}
		arr[j + 1] = temp
	}
	return arr
}

// 选择排序
const selectSort = (arr) => {
	for (let i = 0; i < arr.length; i++) {
		let maxValue = -Infinity
		let maxIndex = 0
		for (let j = i; j < arr.length; j++) {
			if (maxValue < arr[j]) {
				maxValue = arr[j]
				maxIndex = j
			}
		}
		;[arr[i], arr[maxIndex]] = [arr[maxIndex], arr[i]]
	}
	return arr
}

// 快速排序
const quickSort = (arr) => {
	if (arr.length <= 1) return arr
	let pivot = Math.floor((arr.length - 1) / 2)
	const val = arr[pivot]
	let less = []
	let more = []
	arr.splice(pivot, 1)
	arr.forEach((i) => {
		if (i < val) {
			less.push(i)
		} else {
			more.push(i)
		}
	})
	return quickSort(less).concat([val], quickSort(more))
}

// 优化版 快排
const updateQuickSort = (arr, start, end) => {
	if (start >= end) {
		return
	}
	let startIndex = start
	let endIndex = end
	let pivot = arr[start]

	while (startIndex < endIndex) {
		// from right to left
		while (startIndex < endIndex && arr[endIndex] > pivot) {
			endIndex--
		}
		arr[startIndex] = arr[endIndex]

		// from left to right
		while (startIndex < endIndex && arr[startIndex] <= pivot) {
			startIndex++
		}
		arr[endIndex] = arr[startIndex]
		console.log(arr)
	}
	arr[startIndex] = pivot
	updateQuickSort(arr, start, startIndex - 1)
	updateQuickSort(arr, startIndex + 1, end)

	return arr
}

// 归并排序
function merge(left, right) {
  let result = []
  while(left.length > 0 && right.length > 0) {
    // 从小到大
    if (left[0] < right[0]) {
      result.push(left.shift())
    } else {
      result.push(right.shift())
    }

    // // 从大到小
    // if (left[0] < right[0]) {
    //   result.push(right.shift())
    // } else {
    //   result.push(left.shift())
    // }
  }
  return result.concat(left).concat(right)
}
const mergeSort = (arr) => {
  if (arr.length === 1) { 
    return arr
  }
  const middleIndex = Math.floor(arr.length / 2)
  const left = arr.slice(0, middleIndex)
  const right = arr.slice(middleIndex)
  return merge(mergeSort(left), mergeSort(right))
}

// 希尔排序
const shellSort = arr => {
	let h = arr.length;
	while (true) {
		h = Math.floor(h / 2)
		for (let x = 0; x < h; x++) {
			// 间隔 h 分组，组内直接插入排序
			for (let i = x + h; i < arr.length; i = i + h) {
				let temp = arr[i]
				let j
				for (j = i - h; j >= 0; j = j - h) {
					if (arr[j] > temp) {
						arr[j + h] = arr[j]
					} else {
						break
					}
				}
				arr[j + h] = temp;	
			}
		}
		if (h === 1) {
			break
		}
	}
	return arr
}

// 堆排序

// const res = bubbleSort(mockData, judge)
const res = insertSort(mockData)
// const res = selectSort(mockData)
// const res = quickSort(mockData)
// const res = updateQuickSort(mockData, 0, mockData.length - 1)
// const res = mergeSort(mockData)
// const res = shellSort(mockData)

console.log(res)
