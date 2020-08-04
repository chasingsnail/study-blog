纲要

1. 简单介绍什么是 diff

2. 介绍 VNode

3. react diff

   寻找最大索引

4. 通过 react diff 不足引出 Vue 2.x 版本 diff

   1. 双端比较
   2. Key 的作用：为什么要使用key，为何不使用 index 或 random 作为 key

5. Vue 3 Diff

   1. 维护数组遍历判断是否需要移动，创建
   2. 优化点：介绍最长子序列，减少节点移动
   3. 对比 Vue 2.x 版本