const fs = require('fs')
const path = require('path')

const combination = require('./lib/combination')

let sixStarTag = false;
let fiveStarTag = false;

function packToObject(tagStaff = []) {
  let min = 6;
  let max = 1;
  for (let i = 0; i < tagStaff.length; i++) {
    if (tagStaff[i].star < min) min = tagStaff[i].star;
    if (tagStaff[i].star > max) max = tagStaff[i].star;
  }
  // 过滤六星干员
  for (let i = 0; i < tagStaff.length; i++) {
    if (tagStaff[i].star == 6 && !sixStarTag) {
      tagStaff.splice(i, 1);
      i--;
    }
  }
  return {
    "minStar": min,
    "maxStar": max,
    "staff": tagStaff,
  };
}

/*
* 基本操作：每个单独标签展示可能干员
* 当组合标签出现四星及以上的干员时才进行展示
* 以数组的形式返回结果
* 参数内传入 <=5 数量的tag
* 错误码:
* 1 原始数据读取失败
* 2 tag 名称违法
* 3 无标签传入
*/
function arkOpenRecruitment(userTag = []) {
  let res = {};
  sixStarTag = false;
  fiveStarTag = false;

  if (!userTag.length) return 3;
  // 获取原始数据
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, "/data", path.basename(__filename, '.js') + '.json'), 'utf-8'));
  if (!data) return 1;

  // 判断标签是否合法
  const allTag = []
  for (let index = 0; index < data.tag.length; index++) {
    const item = data.tag[index];
    for (let j = 0; j < item.tags.length; j++) {
      allTag.push(item.tags[j]);
    }
  }

  for (let i = 0; i < userTag.length; i++) {
    if (userTag[i] === "高级资深干员") sixStarTag = true;
    else if (userTag[i] === "资深干员") fiveStarTag = true;
    if (allTag.indexOf(userTag[i]) == -1) return 2;
  }

  // 标签对应干员数据
  let staffData = {};
  for (let i = 0; i < userTag.length; i++) {
    staffData[userTag[i]] = [];
  }

  let staffLen = data.staff.length;
  // 推入
  for (let i = 0; i < staffLen; i++) {
    for (let j = 0; j < userTag.length; j++) {
      if (data.staff[i].tags.indexOf(userTag[j]) > -1) {
        if (data.staff[i].star < 6 || sixStarTag) {
          staffData[userTag[j]].push(data.staff[i]);
        }
      }
    }
  }

  // 如果 tag 只有一个
  if (userTag.length == 1) {
    res[userTag[0]] = packToObject(staffData[userTag[0]]);
    return res;
  }

  // 查两个标签4星的并集
  let twoTagData = {};
  let twoTagArr = combination(userTag, 2);

  for (let i = 0; i < twoTagArr.length; i++) {
    let queryRes = []
    let tag1 = twoTagArr[i][0];
    let tag2 = twoTagArr[i][1];
    let len1 = staffData[tag1].length;
    let len2 = staffData[tag2].length;
    // 遍历每个干员，查找包含两个标签而且标签组合大于3星的并集，如果是3星则直接跳出该
    let flag = 0;
    for (let j = 0; j < len1; j++) {
      for (let k = 0; k < len2; k++) {
        if (staffData[tag1][j].name == staffData[tag2][k].name) {
          // 如果有3星tag则跳过该组合
          if (staffData[tag1][j].star <= 3) {
            flag = 1;
            break;
          }
          // 检测是否有高资标签
          else if (staffData[tag1][j].star == 6 && !sixStarTag) {
            continue;
          }
          // 将4星及以上tag放入结果
          else {
            queryRes.push(staffData[tag1][j]);
          }
        };
      }
      if (flag) break;
    }
    // 如果有3星tag则跳过该组合
    if (flag) continue;
    else {
      let tagCombination = twoTagArr[i].toString();
      let resObj = packToObject(queryRes);
      if (resObj.staff.length) twoTagData[tagCombination] = resObj;
    }
  }
  // 第一次筛选，筛选出组合在4星及以上的双标签

  // 第二次筛选，从双tag中筛选三tag
  let threeTagData = {};
  if (userTag.length > 2) {

    // 求组合排列
    let threeTagArr = combination(userTag, 3);

    for (let i in twoTagData) {

      let twoTagArrItem = i.split(",");

      for (let j = 0; j < threeTagArr.length; j++) {
        let queryRes = [];
        let threeTagArrItem = threeTagArr[j];

        // 根据双标签筛选出三标签中多余的一个tag
        let thirdTag = "";
        let cnt = 0;
        for (let k = 0; k < threeTagArrItem.length; k++) {
          if (twoTagArrItem.indexOf(threeTagArrItem[k]) == -1) {
            cnt++;
            thirdTag = threeTagArrItem[k];
          }
        }
        if (cnt >= 2) continue;

        // 在当前双tag下筛选拥有第三个tag的干员
        let len = twoTagData[i].staff.length;
        for (let k = 0; k < len; k++) {
          const item = twoTagData[i].staff[k];
          if (item.tags.indexOf(thirdTag) > -1 && twoTagArrItem.indexOf(thirdTag) == -1) {
            queryRes.push(item);
          }
        }

        if (queryRes.length) {
          // 遍历结果 ， 如果结果已经有此次查询所得到的数据则跳过
          let flag = 0
          for (let item in threeTagData) {

            let itemArr = item.split(",");
            itemArr = itemArr.sort((a, b) => { return a > b });

            let queryArr = twoTagArrItem;
            queryArr.push(thirdTag);
            queryArr = queryArr.sort((a, b) => { return a > b });

            if (itemArr == queryArr) {
              flag = 1;
              break;
            }
          }
          if (!flag) threeTagData[threeTagArr[j]] = packToObject(queryRes);
        }
      }
    }

  }
  // 第二次筛选，筛选出组合在4星及以上的三标签

  // 放入结果
  for (const item in threeTagData) {
    res[item] = threeTagData[item];
  }
  for (const item in twoTagData) {
    res[item] = twoTagData[item];
  }
  for (const item in staffData) {
    res[item] = packToObject(staffData[item]);
  }
  return res;
}

module.exports = arkOpenRecruitment;