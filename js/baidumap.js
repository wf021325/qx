/* 
# 来源 https://github.com/RuCu6/QuanX/blob/main/Rewrites/Cube/bdmap.snippet
#!name = 百度地图
#!desc = 移除广告
#!author = RuCu6
#!update = 2023-05-05 18:35

[rewrite_local]
# 组件包
^https:\/\/newclient\.map\.baidu\.com\/client\/crossmarketing\/\?container=du_aide_module url reject-dict
^https:\/\/newclient\.map\.baidu\.com\/client\/crossmarketing\/\?container=du_card_ugc url reject-dict
^https:\/\/newclient\.map\.baidu\.com\/client\/crossmarketing\/\?container=du_trip_route_tab url reject-dict
^https:\/\/newclient\.map\.baidu\.com\/client\/crossmarketing\/\?oem= url reject-dict
^https:\/\/newclient\.map\.baidu\.com\/client\/imap\/dl\/s\/UpdateInfo\.php\? url script-response-body https://raw.githubusercontent.com/wf021325/qx/master/js/baidumap.js
# 首页 小横条,左上角动图
^https:\/\/newclient\.map\.baidu\.com\/client\/noticebar\/get\? url reject-dict
^https:\/\/newclient\.map\.baidu\.com\/client\/phpui2\/\?qt=ads url reject-dict
# 我的页面
^https:\/\/newclient\.map\.baidu\.com\/client\/usersystem\/mine\/page\? url script-response-body https://raw.githubusercontent.com/wf021325/qx/master/js/baidumap.js
^https:\/\/newclient\.map\.baidu\.com\/grow-engine\/api\/common\/userHome\? url reject-dict
# 打车页
^https:\/\/yongche\.baidu\.com\/goorder\/passenger\/notice url reject-dict
^https:\/\/yongche\.baidu\.com\/gomarketing\/api\/activity\/talos\/activitycard\? url reject-dict
^https:\/\/yongche\.baidu\.com\/gomarketing\/api\/popup\/getentrancecordovaurl url reject-dict
^https:\/\/yongche\.baidu\.com\/goorder\/passenger\/baseinfo url reject-dict

[mitm]
hostname = newclient.map.baidu.com, yongche.baidu.com

 */


// 2023-05-05 18:35
const url = $request.url;
if (!$response.body) $done({});
let obj = JSON.parse($response.body);

if (url.includes("/usersystem/mine/page")) {
  const item = [
    "car", // 我的车辆
    "gold", // 金币商城等活动
    "voice" // 语音包
  ];
  if (obj.data) {
    item.forEach((i) => {
      delete obj.data[i];
    });
  }
} else if (url.includes("/noticebar/get")) {
  if (obj.content?.multi_data) {
    obj.content.multi_data = [];
  }
} else if (url.includes("/imap/dl/s/UpdateInfo")) {
  const item = [
    "map.iphone.baidu.aihomenearbycontent", // 新首页附近组件
    "map.iphone.baidu.cater", // 美食
    "map.iphone.baidu.comdetailtmpl", // 通用详情页
    "map.iphone.baidu.hotel", // 酒店
    // "map.iphone.baidu.movie", // 电影
    "map.iphone.baidu.nearbybraavos", // 美食休闲
    "map.iphone.baidu.nearbycontent", // 周边组件
    "map.iphone.baidu.scenery", // 景点
    "map.iphone.baidu.surround", // 新周边
    "map.iphone.baidu.usersystem", // 用户体系
    "map.iphone.baidu.websdk" // websdk
  ];
  if (obj?.packages) {
    item.forEach((i) => {
      delete obj.packages[i];
    });
  }
}

$done({ body: JSON.stringify(obj) });