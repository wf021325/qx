/*
小豆苗 APP获取Token&签到
仅QX测试，其他自测

# 说明：经过测试，Token每日过期，
# 过期后，打开客户端，导致脚本内Token失效，
# 故脚本先检测Token是否过期，过期后自动更新Token,此时会导致客户端Token失效
# 当你打开客户端再登录时，脚本Token又失效
# 所以您最好不要关闭重写，方便随时获取Token，
# ****特别注意：获取到Token不会弹窗提醒****

# 广告 暂未处理 https://dm.yeemiao.com/ad/get-ads-map

======调试区|忽略======
# ^https?:\/\/dm\.yeemiao\.com\/common\/newmsg\/getUnReadTotalNum$ url script-request-header http://192.168.2.170:8080/xdm.js
======调试区|忽略======

====================================
[rewrite_local]
^https?:\/\/dm\.yeemiao\.com\/common\/newmsg\/getUnReadTotalNum$ url script-request-header https://raw.githubusercontent.com/wf021325/qx/master/task/xdm.js
#######    ^https:\/\/dm\.yeemiao\.com\/user\/login2$ url script-request-body http://192.168.2.170:8080/xdm.js

[task_local]
1 0 * * * https://raw.githubusercontent.com/wf021325/qx/master/task/xdm.js, tag=小豆苗, enabled=true

[mitm]
hostname = dm.yeemiao.com
====================================
 */

const $ = new Env("小豆苗APP");
const _key = 'XDM_Header';
let Token = $.getdata(_key);
var message = "";

!(async() => {
    if (typeof $request != "undefined") {
        getToken();
        return;
    }
	intmd5();//载入MD5
    await checkToken()//检查token
    if(isLogin == 2){
        await updataToken();//更新token
        Token = $.getdata(_key);
    }
    await signin();
    await submit();
    await status();
    await notify();
})()
    .catch((e) => {
        $.log("", `❌失败! 原因: ${e}!`, "");
    })
    .finally(() => {
        $.done();
    });

function getToken() {
    if ($request && $request.method != 'OPTIONS' && $request.headers.hasOwnProperty("token")) {
        let a = $request.headers['token'];
        $.setdata(a, _key)
        //$.msg($.name, '', '获取签到Token成功🎉\n'+a)
    }
}

function GetStr() {
    let a = {
        "token": Token,
        "timestamp": new Date().getTime()
    }
    return JSON.stringify(a);
}
function GetSign(sign_str){
    let a = sign_str + 'dwsad3$#@$!!@#^%&$_'
    return md5(a).toString()
}
function getBody(){
    let str = GetStr();
    let obj = JSON.parse(str);
    let sign = GetSign(str);
    obj.sign = sign;
    return JSON.stringify(obj)
}
function getHeaders() {
    return {
        'User-Agent': 'yeemiao/6.36.0 (iPhone; iOS 15.6.1; Scale/2.00);xdm/6.36.0;appBuild/202308162015;iOS/15.6.1',
        'Content-Type': 'application/json;charset=utf-8',
        'token': Token,
    }
}

function checkToken() {
    return new Promise((resolve) => {
        let obj = {"token":Token,"userId":10086,"timestamp":new Date().getTime()};
        let sign = GetSign(JSON.stringify(obj));
        obj.sign = sign;
        body = JSON.stringify(obj);
        headers = getHeaders();
        url = 'https://dm.yeemiao.com/askDoctor/doctor/get-doctor-by-user';
        const rest = {url, headers, body};
        $.post(rest, (error, response, data) => {
            try {
                var obj = JSON.parse(data);
                if (obj?.code == '00000' || obj?.code == '01000080000' ) {
                    //{"code":"01000080000","errorMsg":"该医生已下线"}
                    isLogin = 1
                    message += `检查Token:成功\n`;
                } else if(obj?.code=='00200010006'){
                    isLogin = 2
                    message += `检查Token失败:${obj?.errorMsg}\n`;
                    //{"code":"00200010006","name":"USER_TOKEN","errorMsg":"token已过有效期"}

                }else{
                    isLogin = 3
                    message += `检查Token失败:${obj?.errorMsg}\n`;
                    //{"code":"00600010006","name":"USER_TOKEN","errorMsg":"无效的token"}
                }
            } catch (e) {
                isLogin = 4
                $.logErr(e,"❌检查Token请重新登陆更新Token");
            } finally {
                resolve();
            }
        });
    });
}

function updataToken() {
    return new Promise((resolve) => {
        body = getBody();
        headers = getHeaders();
        url = 'https://dm.yeemiao.com/user/updateLoginToken';
        const rest = {url, headers, body};
        $.post(rest, (error, response, data) => {
            try {
                var obj = JSON.parse(data);
                if (obj?.code == '00000') {
                    Token = obj.data.token
                    message += `更新Token:更新成功\n`;
                    $.setdata(Token, _key)
                } else {
                    message += `更新Token失败:${obj?.errorMsg}\n`;
                }
            } catch (e) {
                $.logErr(e,"❌更新Token请重新登陆更新Token");
            } finally {
                resolve();
            }
        });
    });
}

function signin() {
    return new Promise((resolve) => {
        body = getBody();
        headers = getHeaders();
        url = 'https://dm.yeemiao.com/point/signin/v2';
        const rest = {url, headers, body};
        $.post(rest, (error, response, data) => {
            try {
                var obj = JSON.parse(data);
                $.log('签到11111：'+data);
                if (obj?.code == '00000') {
                    message += `签到1:签到成功\n`;
                } else if (obj?.code == '006') {
                    message += `签到1:${obj?.errorMsg}\n`;
                } else {
                    message+=`❌签到失败1:${obj?.errorMsg}!\n`
                }
            } catch (e) {
                $.logErr(e,"❌请重新登陆更新Token");
            } finally {
                resolve();
            }
        });
    });
}

function submit() {
    return new Promise((resolve) => {
        let a =`{"missionCodeList":["uTAwwT","ub12hN"],"timestamp":${new Date().getTime()},"url":"https:\\/\\/dm.yeemiao.com\\/point\\/signin\\/v2","token":"${Token}","extra":"{\\"token\\":\\"${Token}\\"}"}`
        let sign = GetSign(a);
        let obj = JSON.parse(a);
        obj.sign = sign;
        body = JSON.stringify(obj);
        body = body.replace('https://dm.yeemiao.com/point/signin/v2','https:\\/\\/dm.yeemiao.com\\/point\\/signin\\/v2');
        headers = getHeaders();
        url = 'https://dm.yeemiao.com/mission/submit/v2';
        const rest = {url, headers, body};
        $.post(rest, (error, response, data) => {
            try {
                var obj = JSON.parse(data);
                $.log('签到22222：'+data);
                if (obj?.code == '00000') {
					msg = obj?.data?.toastText || '重复签到'
                    message += `签到2:${msg}\n`;
                } else if (obj?.code == '006') {
                    message += `签到2:${obj?.errorMsg}\n`;
                } else {
                    message+=`❌签到失败2:${obj?.errorMsg}!\n`
                }
            } catch (e) {
                $.logErr(e,"❌请重新登陆更新Token");
            } finally {
                resolve();
            }
        });
    });
}

function status() {
    return new Promise((resolve) => {
        body = getBody();
        headers = getHeaders();
        url = 'https://dm.yeemiao.com/point/getUserPointInfo';
        const rest = {url, headers, body};;
        $.post(rest, (error, response, data) => {
            var obj = JSON.parse(data);
            if (obj?.code == '00000') {
                message+=`当前积分:${obj?.data?.pointTotal}`
            } else {
                $.msg($.name, "", `❌${obj?.errorMsg}`);
            }
            resolve();
        });
    });
}

async function notify() {$.msg($.name, "", message);}

//MD5
function intmd5(){!function(n){"use strict";function t(n,t){var r=(65535&n)+(65535&t);return(n>>16)+(t>>16)+(r>>16)<<16|65535&r}function r(n,r,e,o,u,c){return t((c=t(t(r,n),t(o,c)))<<u|c>>>32-u,e)}function e(n,t,e,o,u,c,f){return r(t&e|~t&o,n,t,u,c,f)}function o(n,t,e,o,u,c,f){return r(t&o|e&~o,n,t,u,c,f)}function u(n,t,e,o,u,c,f){return r(t^e^o,n,t,u,c,f)}function c(n,t,e,o,u,c,f){return r(e^(t|~o),n,t,u,c,f)}function f(n,r){var f,i,a,h;n[r>>5]|=128<<r%32,n[14+(r+64>>>9<<4)]=r;for(var d=1732584193,l=-271733879,g=-1732584194,v=271733878,m=0;m<n.length;m+=16)d=c(d=u(d=u(d=u(d=u(d=o(d=o(d=o(d=o(d=e(d=e(d=e(d=e(f=d,i=l,a=g,h=v,n[m],7,-680876936),l=e(l,g=e(g,v=e(v,d,l,g,n[m+1],12,-389564586),d,l,n[m+2],17,606105819),v,d,n[m+3],22,-1044525330),g,v,n[m+4],7,-176418897),l=e(l,g=e(g,v=e(v,d,l,g,n[m+5],12,1200080426),d,l,n[m+6],17,-1473231341),v,d,n[m+7],22,-45705983),g,v,n[m+8],7,1770035416),l=e(l,g=e(g,v=e(v,d,l,g,n[m+9],12,-1958414417),d,l,n[m+10],17,-42063),v,d,n[m+11],22,-1990404162),g,v,n[m+12],7,1804603682),l=e(l,g=e(g,v=e(v,d,l,g,n[m+13],12,-40341101),d,l,n[m+14],17,-1502002290),v,d,n[m+15],22,1236535329),g,v,n[m+1],5,-165796510),l=o(l,g=o(g,v=o(v,d,l,g,n[m+6],9,-1069501632),d,l,n[m+11],14,643717713),v,d,n[m],20,-373897302),g,v,n[m+5],5,-701558691),l=o(l,g=o(g,v=o(v,d,l,g,n[m+10],9,38016083),d,l,n[m+15],14,-660478335),v,d,n[m+4],20,-405537848),g,v,n[m+9],5,568446438),l=o(l,g=o(g,v=o(v,d,l,g,n[m+14],9,-1019803690),d,l,n[m+3],14,-187363961),v,d,n[m+8],20,1163531501),g,v,n[m+13],5,-1444681467),l=o(l,g=o(g,v=o(v,d,l,g,n[m+2],9,-51403784),d,l,n[m+7],14,1735328473),v,d,n[m+12],20,-1926607734),g,v,n[m+5],4,-378558),l=u(l,g=u(g,v=u(v,d,l,g,n[m+8],11,-2022574463),d,l,n[m+11],16,1839030562),v,d,n[m+14],23,-35309556),g,v,n[m+1],4,-1530992060),l=u(l,g=u(g,v=u(v,d,l,g,n[m+4],11,1272893353),d,l,n[m+7],16,-155497632),v,d,n[m+10],23,-1094730640),g,v,n[m+13],4,681279174),l=u(l,g=u(g,v=u(v,d,l,g,n[m],11,-358537222),d,l,n[m+3],16,-722521979),v,d,n[m+6],23,76029189),g,v,n[m+9],4,-640364487),l=u(l,g=u(g,v=u(v,d,l,g,n[m+12],11,-421815835),d,l,n[m+15],16,530742520),v,d,n[m+2],23,-995338651),g,v,n[m],6,-198630844),l=c(l=c(l=c(l=c(l,g=c(g,v=c(v,d,l,g,n[m+7],10,1126891415),d,l,n[m+14],15,-1416354905),v,d,n[m+5],21,-57434055),g=c(g,v=c(v,d=c(d,l,g,v,n[m+12],6,1700485571),l,g,n[m+3],10,-1894986606),d,l,n[m+10],15,-1051523),v,d,n[m+1],21,-2054922799),g=c(g,v=c(v,d=c(d,l,g,v,n[m+8],6,1873313359),l,g,n[m+15],10,-30611744),d,l,n[m+6],15,-1560198380),v,d,n[m+13],21,1309151649),g=c(g,v=c(v,d=c(d,l,g,v,n[m+4],6,-145523070),l,g,n[m+11],10,-1120210379),d,l,n[m+2],15,718787259),v,d,n[m+9],21,-343485551),d=t(d,f),l=t(l,i),g=t(g,a),v=t(v,h);return[d,l,g,v]}function i(n){for(var t="",r=32*n.length,e=0;e<r;e+=8)t+=String.fromCharCode(n[e>>5]>>>e%32&255);return t}function a(n){var t=[];for(t[(n.length>>2)-1]=void 0,e=0;e<t.length;e+=1)t[e]=0;for(var r=8*n.length,e=0;e<r;e+=8)t[e>>5]|=(255&n.charCodeAt(e/8))<<e%32;return t}function h(n){for(var t,r="0123456789abcdef",e="",o=0;o<n.length;o+=1)t=n.charCodeAt(o),e+=r.charAt(t>>>4&15)+r.charAt(15&t);return e}function d(n){return unescape(encodeURIComponent(n))}function l(n){return i(f(a(n=d(n)),8*n.length))}function g(n,t){return function(n,t){var r,e=a(n),o=[],u=[];for(o[15]=u[15]=void 0,16<e.length&&(e=f(e,8*n.length)),r=0;r<16;r+=1)o[r]=909522486^e[r],u[r]=1549556828^e[r];return t=f(o.concat(a(t)),512+8*t.length),i(f(u.concat(t),640))}(d(n),d(t))}function v(n,t,r){return t?r?g(t,n):h(g(t,n)):r?l(n):h(l(n))}"function"==typeof define&&define.amd?define(function(){return v}):"object"==typeof module&&module.exports?module.exports=v:n.md5=v}(this);}
//*****************************
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,a)=>{s.call(this,t,(t,s,r)=>{t?a(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.encoding="utf-8",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}getEnv(){return"undefined"!=typeof $environment&&$environment["surge-version"]?"Surge":"undefined"!=typeof $environment&&$environment["stash-version"]?"Stash":"undefined"!=typeof module&&module.exports?"Node.js":"undefined"!=typeof $task?"Quantumult X":"undefined"!=typeof $loon?"Loon":"undefined"!=typeof $rocket?"Shadowrocket":void 0}isNode(){return"Node.js"===this.getEnv()}isQuanX(){return"Quantumult X"===this.getEnv()}isSurge(){return"Surge"===this.getEnv()}isLoon(){return"Loon"===this.getEnv()}isShadowrocket(){return"Shadowrocket"===this.getEnv()}isStash(){return"Stash"===this.getEnv()}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const a=this.getdata(t);if(a)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,a)=>e(a))})}runScript(t,e){return new Promise(s=>{let a=this.getdata("@chavy_boxjs_userCfgs.httpapi");a=a?a.replace(/\n/g,"").trim():a;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[i,o]=a.split("@"),n={url:`http://${o}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":i,Accept:"*/*"},timeout:r};this.post(n,(t,e,a)=>s(a))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),a=!s&&this.fs.existsSync(e);if(!s&&!a)return{};{const a=s?t:e;try{return JSON.parse(this.fs.readFileSync(a))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),a=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):a?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const a=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of a)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,a)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[a+1])>>0==+e[a+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,a]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,a,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,a,r]=/^@(.*?)\.(.*?)$/.exec(e),i=this.getval(a),o=a?"null"===i?null:i||"{}":"{}";try{const e=JSON.parse(o);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),a)}catch(e){const i={};this.lodash_set(i,r,t),s=this.setval(JSON.stringify(i),a)}}else s=this.setval(t,e);return s}getval(t){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.read(t);case"Quantumult X":return $prefs.valueForKey(t);case"Node.js":return this.data=this.loaddata(),this.data[t];default:return this.data&&this.data[t]||null}}setval(t,e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.write(t,e);case"Quantumult X":return $prefs.setValueForKey(t,e);case"Node.js":return this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0;default:return this.data&&this.data[e]||null}}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){switch(t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"],delete t.headers["content-type"],delete t.headers["content-length"]),t.params&&(t.url+="?"+this.queryStr(t.params)),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,a)=>{!t&&s&&(s.body=a,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,a)});break;case"Quantumult X":this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:a,headers:r,body:i,bodyBytes:o}=t;e(null,{status:s,statusCode:a,headers:r,body:i,bodyBytes:o},i,o)},t=>e(t&&t.error||"UndefinedError"));break;case"Node.js":let s=require("iconv-lite");this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:a,statusCode:r,headers:i,rawBody:o}=t,n=s.decode(o,this.encoding);e(null,{status:a,statusCode:r,headers:i,rawBody:o,body:n},n)},t=>{const{message:a,response:r}=t;e(a,r,r&&s.decode(r.rawBody,this.encoding))})}}post(t,e=(()=>{})){const s=t.method?t.method.toLocaleLowerCase():"post";switch(t.body&&t.headers&&!t.headers["Content-Type"]&&!t.headers["content-type"]&&(t.headers["content-type"]="application/x-www-form-urlencoded"),t.headers&&(delete t.headers["Content-Length"],delete t.headers["content-length"]),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient[s](t,(t,s,a)=>{!t&&s&&(s.body=a,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,a)});break;case"Quantumult X":t.method=s,this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:a,headers:r,body:i,bodyBytes:o}=t;e(null,{status:s,statusCode:a,headers:r,body:i,bodyBytes:o},i,o)},t=>e(t&&t.error||"UndefinedError"));break;case"Node.js":let a=require("iconv-lite");this.initGotEnv(t);const{url:r,...i}=t;this.got[s](r,i).then(t=>{const{statusCode:s,statusCode:r,headers:i,rawBody:o}=t,n=a.decode(o,this.encoding);e(null,{status:s,statusCode:r,headers:i,rawBody:o,body:n},n)},t=>{const{message:s,response:r}=t;e(s,r,r&&a.decode(r.rawBody,this.encoding))})}}time(t,e=null){const s=e?new Date(e):new Date;let a={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in a)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?a[e]:("00"+a[e]).substr((""+a[e]).length)));return t}queryStr(t){let e="";for(const s in t){let a=t[s];null!=a&&""!==a&&("object"==typeof a&&(a=JSON.stringify(a)),e+=`${s}=${a}&`)}return e=e.substring(0,e.length-1),e}msg(e=t,s="",a="",r){const i=t=>{switch(typeof t){case void 0:return t;case"string":switch(this.getEnv()){case"Surge":case"Stash":default:return{url:t};case"Loon":case"Shadowrocket":return t;case"Quantumult X":return{"open-url":t};case"Node.js":return}case"object":switch(this.getEnv()){case"Surge":case"Stash":case"Shadowrocket":default:{let e=t.url||t.openUrl||t["open-url"];return{url:e}}case"Loon":{let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}case"Quantumult X":{let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl,a=t["update-pasteboard"]||t.updatePasteboard;return{"open-url":e,"media-url":s,"update-pasteboard":a}}case"Node.js":return}default:return}};if(!this.isMute)switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:$notification.post(e,s,a,i(r));break;case"Quantumult X":$notify(e,s,a,i(r));break;case"Node.js":}if(!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),a&&t.push(a),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:this.log("",`❗️${this.name}, 错误!`,t);break;case"Node.js":this.log("",`❗️${this.name}, 错误!`,t.stack)}}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;switch(this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:$done(t);break;case"Node.js":process.exit(1)}}}(t,e)}
