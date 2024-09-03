/*
彩云天气

====================================
[filter_local]
# 上传信息
host, gather.colorfulclouds.net ,reject

[rewrite_local]
# 7.1.9 限时福利Svip
^https:\/\/biz\.cyapi\.cn\/p\/v1\/trial_card\/info url reject-dict
# 7.2.0普通版修改VIP后提示账号迁移
^https:\/\/biz\.cyapi\.cn\/api\/v1\/token\/device$ url reject-dict
# 赏叶赏花模块
^https:\/\/wrapper\.cyapi\.cn\/v1\/activity\?app_name=weather url script-response-body https://raw.githubusercontent.com/wf021325/qx/master/js/caiyun.js
# 解锁旧版vip(7.20.0之前)
^https:\/\/biz\.cyapi\.cn\/v2\/user url script-response-body https://raw.githubusercontent.com/wf021325/qx/master/js/caiyun.js
# 卫星云图 48小时预报
^https:\/\/wrapper\.cyapi\.cn\/v1\/(satellite|nafp\/origin_images) url script-request-header https://raw.githubusercontent.com/wf021325/qx/master/js/caiyun.js
# 7.20.0版本显示VIP
^https?:\/\/biz\.cyapi\.cn\/api\/v1\/user_detail$ url script-response-body https://raw.githubusercontent.com/wf021325/qx/master/js/caiyun.js

[mitm]
hostname = biz.cyapi.cn, wrapper.cyapi.cn
====================================
 */
var huihui = {}, url = $request.url, headers = ObjectKeys2LowerCase($request.headers);
if (url.includes("/v2/user")) {
    let obj = JSON.parse($response.body);
    Object.assign(obj.result, {is_vip: true, svip_expired_at: 3742732800, vip_type: "s"});
    huihui.body = JSON.stringify(obj)
} else if (/v1\/(satellite|nafp\/origin_images)/.test(url)) {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2ZXJzaW9uIjoxLCJ1c2VyX2lkIjoiNWY1YmZjNTdkMmM2ODkwMDE0ZTI2YmI4Iiwic3ZpcF9leHBpcmVkX2F0IjoxNzA1MzMxMTY2LjQxNjc3MSwidmlwX2V4cGlyZWRfYXQiOjB9.h_Cem89QarTXxVX9Z_Wt-Mak6ZHAjAJqgv3hEY6wpps';
    huihui.headers = {...headers, 'device-token': token};
    if (compareVersions(headers['app-version'], '7.19.0') > 0) {
        huihui.headers['authorization'] = 'Bearer ' + token;
    }
} else if (url.includes('v1/activity')) {
    const body = compareVersions(headers['app-version'], '7.20.0') < 0 ? '{"status":"ok","activities":[{"items":[{}]}]}' : '{"status":"ok","activities":[]}';
    huihui.body = body;
} else if (url.includes('/user_detail')) {
    const obj = JSON.parse($response.body);
    Object.assign(obj.vip_info.svip, {is_auto_renewal: true, expires_time: '3742732800'});
    huihui.body = JSON.stringify(obj)
}
$done(huihui);

function compareVersions(t,r){"string"!=typeof t&&(t="0"),"string"!=typeof r&&(r="0");const e=t.split(".").map(Number),n=r.split(".").map(Number);for(let t=0;t<Math.max(e.length,n.length);t++){const r=e[t]||0,i=n[t]||0;if(r>i)return 1;if(r<i)return-1}return 0}
function ObjectKeys2LowerCase(obj){return Object.fromEntries(Object.entries(obj).map(([k,v])=>[k.toLowerCase(),v]))};



















//eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2ZXJzaW9uIjoxLCJ1c2VyX2lkIjoiNWY1YmZjNTdkMmM2ODkwMDE0ZTI2YmI4Iiwic3ZpcF9leHBpcmVkX2F0IjoxNzA1MzMxMTY2LjQxNjc3MSwidmlwX2V4cGlyZWRfYXQiOjB9.h_Cem89QarTXxVX9Z_Wt-Mak6ZHAjAJqgv3hEY6wppslet //eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2ZXJzaW9uIjoxLCJ1c2VyX2lkIjoiNWY1YmZjNTdkMmM2ODkwMDE0ZTI2YmI4Iiwic3ZpcF9leHBpcmVkX2F0IjoxNjc0MjI3MTY2LjQxNjc3MSwidmlwX2V4cGlyZWRfYXQiOjB9.wbgfCRp3W9zEvzEYsiWxerta4G-d-b0qlYCcilevOKY