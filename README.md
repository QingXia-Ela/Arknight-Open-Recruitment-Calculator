# Arknight-Open-Recruitment-Calculator
基于 Nodejs 制作的明日方舟公开招聘计算器

使用方法：在你需要的地方导入 main.js 文件

该文件对外暴露了一个函数，将 tag 以数组的形式传入即可

返回数据结构如下：
```
{
  '标签组合': {
    minStar: 1,
    maxStar: 6,
    staff: [] // 标签组合对应的干员
  },
  ...
}
```
如果返回的是数字，则可以参照下面的错误码来排查：
* 1 data数据读取失败
* 2 tag 名称不存在
* 3 无标签传入

功能仍然在完善中，可能会有 bug ！