/*
彩云天气

====================================
[rewrite_local]
# 普通版广告
^https:\/\/ad\.cyapi\.cn\/v2\/req\?app_name=weather url reject-dict
# 赏叶赏花
^https:\/\/wrapper\.cyapi\.cn\/v1\/activity\?app_name=weather url script-response-body https://raw.githubusercontent.com/wf021325/qx/master/js/caiyun.js
# 解锁vip
^https:\/\/biz\.cyapi\.cn\/v2\/user url script-response-body https://raw.githubusercontent.com/wf021325/qx/master/js/caiyun.js
# 卫星云图 48小时预报
^https:\/\/wrapper\.cyapi\.cn\/v1\/(satellite|nafp\/origin_images) url script-request-header https://raw.githubusercontent.com/wf021325/qx/master/js/caiyun.js
# 7.20.0版本显示VIP
^https?:\/\/biz\.cyapi\.cn\/api\/v1\/user_detail$ url script-response-body https://raw.githubusercontent.com/wf021325/qx/master/js/caiyun.js

[mitm]
hostname = *.cyapi.cn
====================================
 */
var huihui = {},
    url = $request.url;
if (url.includes("/v2/user")) {
    let obj = JSON.parse($response.body);
    obj.result.is_vip = !0,
        obj.result.svip_expired_at = 3742732800,
        obj.result.vip_type = "s",
        huihui.body = JSON.stringify(obj)
}
if (/v1\/(satellite|nafp\/origin_images)/g.test(url)) {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2ZXJzaW9uIjoxLCJ1c2VyX2lkIjoiNWY1YmZjNTdkMmM2ODkwMDE0ZTI2YmI4Iiwic3ZpcF9leHBpcmVkX2F0IjoxNzA1MzMxMTY2LjQxNjc3MSwidmlwX2V4cGlyZWRfYXQiOjB9.h_Cem89QarTXxVX9Z_Wt-Mak6ZHAjAJqgv3hEY6wpps';
    huihui.headers = $request.headers;
    huihui.headers['device-token'] = token;
    if (compareVersions(huihui.headers.version, '7.1.9') > 0) {
        huihui.headers.Authorization = 'Bearer ' + token;
    }
}
if(url.includes('v1/activity')){
	let body = $response.body
    body = '{"status":"ok","activities":[{"items":[]}]}';
	huihui.body = body;
}
if (url.includes('/user_detail')) {
    const obj = JSON.parse($response.body);
    obj.vip_info.svip.is_auto_renewal = true;
    obj.vip_info.svip.expires_time = '3742732800';
    huihui.body = JSON.stringify(obj)
}
$done(huihui);

function compareVersions(t,r){const e=t.split(".").map(Number),n=r.split(".").map(Number);for(let t=0;t<Math.max(e.length,n.length);t++){const r=e[t]||0,i=n[t]||0;if(r>i)return 1;if(r<i)return-1}return 0}




















//eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2ZXJzaW9uIjoxLCJ1c2VyX2lkIjoiNWY1YmZjNTdkMmM2ODkwMDE0ZTI2YmI4Iiwic3ZpcF9leHBpcmVkX2F0IjoxNzA1MzMxMTY2LjQxNjc3MSwidmlwX2V4cGlyZWRfYXQiOjB9.h_Cem89QarTXxVX9Z_Wt-Mak6ZHAjAJqgv3hEY6wppslet //eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2ZXJzaW9uIjoxLCJ1c2VyX2lkIjoiNWY1YmZjNTdkMmM2ODkwMDE0ZTI2YmI4Iiwic3ZpcF9leHBpcmVkX2F0IjoxNjc0MjI3MTY2LjQxNjc3MSwidmlwX2V4cGlyZWRfYXQiOjB9.wbgfCRp3W9zEvzEYsiWxerta4G-d-b0qlYCcilevOKY