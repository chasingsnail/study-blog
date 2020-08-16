import { var1, var2 } from './moduleA'
import * as vars from './moduleB'
import m from './moduleC'

export default {
	var1: 1,
	var2: 2,
}

export const var1 = 1

const obj = {
	var1,
	var2,
}

export default obj


// lib.js
export let counter = 3;
export function increase() {
  counter++;
}
// main.js
import { counter, increase } from './lib';
console.log(counter); // 3
increase();
console.log(counter); // 4


