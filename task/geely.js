/*
吉利汽车签到
测试Quantumult-X，nodejs，其他自测
2024-06-22
2024-08-28
签到风控升级处理，请重新获取cookie,青龙也增加了一个参数

获取Cookie方法 ，QX开重写，进入【吉利汽车】

======调试区|忽略======
# ^https?:\/\/app\.geely\.com\/my\/getMyCenterCounts$ url script-response-body http://192.168.2.170:8080/geely.js
======调试区|忽略======

====================================
[rewrite_local]
^https?:\/\/app\.geely\.com\/my\/getMyCenterCounts$ url script-response-body https://raw.githubusercontent.com/wf021325/qx/master/task/geely.js

[task_local]
1 0 * * * https://raw.githubusercontent.com/wf021325/qx/master/task/geely.js, tag= 吉利汽车签到, enabled=true

[mitm]
hostname = app.geely.com
====================================

# 青龙环境变量     geely_val={"token":"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx","devicesn":"XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"}
 */

const $ = new Env("吉利汽车签到");
const _key = 'geely_val';
const CK_Val = $.toObj(getEnv(_key));
//$.log($.toStr(CK_Val))
$.is_debug ='true--';
$.messages = [];

async function getCk() {
    if ($request && $request.method != 'OPTIONS') {
        const head = ObjectKeys2LowerCase($request.headers);
        const token = head['token'];
        const devicesn = head['devicesn'];
        if (token && devicesn) {
            const ckVal = $.toStr({token, devicesn});
            $.setdata(ckVal, _key);
            $.msg($.name, '获取ck成功🎉', ckVal);
        } else {
            $.msg($.name, '', '❌获取ck失败');
        }
    }
}

async function main() {
    if (CK_Val) {
        const {token, devicesn} = CK_Val;
        if (token && !devicesn) {
            $.msg($.name, '', '❌❌App升级，请重新更新ck🎉🎉');
            return;
        }
        $.token = token;
        $.devicesn = devicesn;
    } else {
        $.msg($.name, '', '❌请先获取ck🎉');
        return;
    }
    $.appversion = $.toObj((await $.http.get(`https://itunes.apple.com/cn/lookup?id=1518762715`))?.body)?.results[0]?.version;
    $.appversion = $.appversion ? $.appversion : "3.25.0";
    $.log(`最新版本号：${$.appversion}`);

    const code = await signIn();//签到
    if (code.includes('token')) {
        return;
    }// 签到错误停止运行
    await getSignMsg();
    await summary();
}

// 签到
async function signIn() {
    let _msg = '';
    url = `https://app.geely.com/api/v1/userSign/sign/risk`;
    ts = Math.floor((new Date).getTime() / 1000);
    time = $.time('yyyy-MM-dd HH:mm:ss', ts * 1000);
    body = `{"signDate":"${time}","ts":"${ts}","cId":"BLqo2nmmoPgGuJtFDWlUjRI2b1b"}`;
    sign = `cId=BLqo2nmmoPgGuJtFDWlUjRI2b1b&signDate=${ts * 1000}&ts=${ts}0]3K@'9MK+6Jf`
    sign = CryptoJS.MD5(sign).toString();
/*    sweet_security_info = {
        "appVersion": $.appversion ,
        "channel": "ios%E5%AE%98%E6%96%B9",
        "deviceUUID": $.devicesn,
        "brand": "Apple",
        "osVersion": "17.6.1",
        "networkType": "NETWORK_WIFI",//
        "battery": "100",//电量
        "os": "iOS",
        "isCharging": "4",//充电
        "isSetProxy": "false",//设置代理
        "isLBSEnabled": "false",//LBS
        "ip": "192.168.1.1",
        "platform": "ios",
        "geelyDeviceId": $.devicesn,
        "screenResolution": "1290 * 2796",//分辨率
        "os_version": "17.6.1",
        "model": "iPhone 15 Pro Max",
        "isUsingVpn": "flase",//VPN
        "isJailbreak": "false"//越狱
    };*/
    sweet_security_info = {
        appVersion: $.appversion ,
        deviceUUID: $.devicesn,
        geelyDeviceId: $.devicesn
    }
    headers = {
        "X-Data-Sign": sign,
        appVersion: $.appversion,
        deviceSN: $.devicesn,
        sweet_security_info: $.toStr(sweet_security_info),
        token: $.token,
        platform: "iOS",
        "User-Agent": `GLMainProject/${$.appversion} (iPhone; iOS 17.6.1; Scale/2.00)`,
        "Content-Type": "application/json",
    };
    const rest = {url, body, headers}
    let {code, data, message} = await httpRequest(rest);
    _msg += `签到：${message}`;//{"code":"fail","message":"您已签到,请勿重复操作!"}
    pushMsg(_msg);
    return code
}

// 累计签到
async function getSignMsg() {
    url = `https://app.geely.com/api/v1/userSign/getSignMsg`;
    const _Date = new Date();
    body = `{"year":"${_Date.getFullYear()}","month":"${_Date.getMonth() + 1}"}`;
    headers = {
        token: $.token,
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148/ios/geelyApp",
    };
    const rest = {url, body, headers}
    let {code, data, message} = await httpRequest(rest);
    let _msg;
    _msg = (code == 'success') ? `累计签到：${data?.continuousSignDay}天` : '';
    pushMsg(_msg);
}
//能力体
async function summary() {
    url = `https://app.geely.com/api/v1/growthSystem/energyBody/summary`;
    headers = {
        appVersion: $.appversion,
        deviceSN: $.devicesn,
        token: $.token ,
        platform: "iOS",
        "User-Agent": `GLMainProject/${$.appversion} (iPhone; iOS 17.6.1; Scale/2.00)`,
    };
    const rest = {url, headers};
    let {code, data, message} = await httpRequest(rest);
    let _msg;
    _msg = (code == 'success') ? `能量体：${parseFloat(data?.total)}` : '';//parseFloat('2.00')
    //{"code":"success","data":{"total":"2.00"},"message":"API调用成功"}
    pushMsg(_msg);

}

async function httpRequest(options) {
    try {
        options = options.url ? options : { url: options };
        const _method = options?._method || ('body' in options ? 'post' : 'get');
        const _respType = options?._respType || 'body';
        const _timeout = options?._timeout || 15e3;
        const _http = [
            new Promise((_, reject) => setTimeout(() => reject(`⛔️ 请求超时: ${options['url']}`), _timeout)),
            new Promise((resolve, reject) => {
                debug(options, '[Request]');
                $[_method.toLowerCase()](options, (error, response, data) => {
                    //debug(response, '[response]');
                    debug(data, '[data]');
                    error && $.log($.toStr(error));
                    if (_respType !== 'all') {
                        resolve($.toObj(response?.[_respType], response?.[_respType]));
                    } else {
                        resolve(response);
                    }
                })
            })
        ];
        return await Promise.race(_http);
    } catch (err) {
        $.logErr(err);
    }
}

// 脚本执行入口
!(async () => {
    if (typeof $request !== `undefined`) {
        getCk();
    } else {
        if (!CK_Val) throw new Error('❌请先获取Token🎉')
        CryptoJS = await intCryptoJS();
        await main();
    }
})().catch((e) => $.messages.push(e.message || e) && $.logErr(e))
    .finally(async () => {
        await sendMsg($.messages.join('\n').trimStart().trimEnd());// 推送通知
        $.done();
    })

//--------
function pushMsg(msg) {
    $.messages.push(msg.trimEnd()), $.log(msg.trimEnd());
}

//加载 crypto-js
async function intCryptoJS() {
    function Eval_Crypto(script_str) {
        const evalFunc = $.isNode() ? global.eval : eval;
        evalFunc(script_str);
        return $.isNode() ? global.CryptoJS : CryptoJS;
    }
    if($.is_debug !== 'true'){//调试模式默认从网络读取js脚本
        let script_str = ($.isNode() ? require("crypto-js") : $.getdata("cryptojs_Script")) || "";
        if ($.isNode()) {
            $.log("✅ " + $.name + ": node环境，默认使用crypto-js模块");
            return script_str;
        }
        if (script_str && Object.keys(script_str).length) {
            $.log("✅ " + $.name + ": 缓存中存在CryptoJS代码, 跳过下载");
            return Eval_Crypto(script_str)
        }
    }
    $.log("🚀 " + "开始下载CryptoJS代码");
    // const script_str = (await $.http.get('http://192.168.2.170:8080/crypto-js.min.js')).body;
    // Eval_Crypto(script_str);
    return new Promise(async resolve => {
        $.getScript('http://ys-l.ysepan.com/551976330/420094417/k5G4J73367NKLlPfoiL4c/crypto-js.min.js').then(script_str => {
            $.setdata(script_str, "cryptojs_Script");
            Eval_Crypto(script_str)
            $.log("✅ CryptoJS加载成功");
            resolve(CryptoJS);
        });
    });
}


function jsonToQueryString(t = {}) {
    return Object.keys(t).sort().map(e => `${encodeURIComponent(e)}=${encodeURIComponent(t[e])}`).join("&");
}

//DEBUG
function debug(content,title="debug"){let start=`\n-----${title}-----\n`;let end=`\n-----${$.time('HH:mm:ss')}-----\n`;if($.is_debug==='true'){if(typeof content=="string"){$.log(start+content+end);}else if(typeof content=="object"){$.log(start+$.toStr(content)+end);}}};

//GET ENV
function getEnv(...keys){for(let key of keys){var value=$.isNode()?process.env[key]||process.env[key.toUpperCase()]||process.env[key.toLowerCase()]||$.getdata(key):$.getdata(key);if(value)return value;}};

//到小写
function ObjectKeys2LowerCase(obj){return Object.fromEntries(Object.entries(obj).map(([k,v])=>[k.toLowerCase(),v]))};

//通知
async function sendMsg(message){if(!message)return;try{if($.isNode()){try{var notify=require('./sendNotify');}catch(e){var notify=require('./utils/sendNotify');}await notify.sendNotify($.name,message);}else{$.msg($.name,'',message);}}catch(e){$.log(`\n\n-----${$.name}-----\n${message}`);}};

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ENV
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,a)=>{s.call(this,t,(t,s,r)=>{t?a(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.encoding="utf-8",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}getEnv(){return"undefined"!=typeof $environment&&$environment["surge-version"]?"Surge":"undefined"!=typeof $environment&&$environment["stash-version"]?"Stash":"undefined"!=typeof module&&module.exports?"Node.js":"undefined"!=typeof $task?"Quantumult X":"undefined"!=typeof $loon?"Loon":"undefined"!=typeof $rocket?"Shadowrocket":void 0}isNode(){return"Node.js"===this.getEnv()}isQuanX(){return"Quantumult X"===this.getEnv()}isSurge(){return"Surge"===this.getEnv()}isLoon(){return"Loon"===this.getEnv()}isShadowrocket(){return"Shadowrocket"===this.getEnv()}isStash(){return"Stash"===this.getEnv()}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const a=this.getdata(t);if(a)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,a)=>e(a))})}runScript(t,e){return new Promise(s=>{let a=this.getdata("@chavy_boxjs_userCfgs.httpapi");a=a?a.replace(/\n/g,"").trim():a;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[i,o]=a.split("@"),n={url:`http://${o}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":i,Accept:"*/*"},timeout:r};this.post(n,(t,e,a)=>s(a))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),a=!s&&this.fs.existsSync(e);if(!s&&!a)return{};{const a=s?t:e;try{return JSON.parse(this.fs.readFileSync(a))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),a=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):a?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const a=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of a)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,a)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[a+1])>>0==+e[a+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,a]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,a,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,a,r]=/^@(.*?)\.(.*?)$/.exec(e),i=this.getval(a),o=a?"null"===i?null:i||"{}":"{}";try{const e=JSON.parse(o);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),a)}catch(e){const i={};this.lodash_set(i,r,t),s=this.setval(JSON.stringify(i),a)}}else s=this.setval(t,e);return s}getval(t){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.read(t);case"Quantumult X":return $prefs.valueForKey(t);case"Node.js":return this.data=this.loaddata(),this.data[t];default:return this.data&&this.data[t]||null}}setval(t,e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.write(t,e);case"Quantumult X":return $prefs.setValueForKey(t,e);case"Node.js":return this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0;default:return this.data&&this.data[e]||null}}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){switch(t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"],delete t.headers["content-type"],delete t.headers["content-length"]),t.params&&(t.url+="?"+this.queryStr(t.params)),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,a)=>{!t&&s&&(s.body=a,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,a)});break;case"Quantumult X":this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:a,headers:r,body:i,bodyBytes:o}=t;e(null,{status:s,statusCode:a,headers:r,body:i,bodyBytes:o},i,o)},t=>e(t&&t.error||"UndefinedError"));break;case"Node.js":let s=require("iconv-lite");this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:a,statusCode:r,headers:i,rawBody:o}=t,n=s.decode(o,this.encoding);e(null,{status:a,statusCode:r,headers:i,rawBody:o,body:n},n)},t=>{const{message:a,response:r}=t;e(a,r,r&&s.decode(r.rawBody,this.encoding))})}}post(t,e=(()=>{})){const s=t.method?t.method.toLocaleLowerCase():"post";switch(t.body&&t.headers&&!t.headers["Content-Type"]&&!t.headers["content-type"]&&(t.headers["content-type"]="application/x-www-form-urlencoded"),t.headers&&(delete t.headers["Content-Length"],delete t.headers["content-length"]),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient[s](t,(t,s,a)=>{!t&&s&&(s.body=a,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,a)});break;case"Quantumult X":t.method=s,this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:a,headers:r,body:i,bodyBytes:o}=t;e(null,{status:s,statusCode:a,headers:r,body:i,bodyBytes:o},i,o)},t=>e(t&&t.error||"UndefinedError"));break;case"Node.js":let a=require("iconv-lite");this.initGotEnv(t);const{url:r,...i}=t;this.got[s](r,i).then(t=>{const{statusCode:s,statusCode:r,headers:i,rawBody:o}=t,n=a.decode(o,this.encoding);e(null,{status:s,statusCode:r,headers:i,rawBody:o,body:n},n)},t=>{const{message:s,response:r}=t;e(s,r,r&&a.decode(r.rawBody,this.encoding))})}}time(t,e=null){const s=e?new Date(e):new Date;let a={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in a)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?a[e]:("00"+a[e]).substr((""+a[e]).length)));return t}queryStr(t){let e="";for(const s in t){let a=t[s];null!=a&&""!==a&&("object"==typeof a&&(a=JSON.stringify(a)),e+=`${s}=${a}&`)}return e=e.substring(0,e.length-1),e}msg(e=t,s="",a="",r){const i=t=>{switch(typeof t){case void 0:return t;case"string":switch(this.getEnv()){case"Surge":case"Stash":default:return{url:t};case"Loon":case"Shadowrocket":return t;case"Quantumult X":return{"open-url":t};case"Node.js":return}case"object":switch(this.getEnv()){case"Surge":case"Stash":case"Shadowrocket":default:{let e=t.url||t.openUrl||t["open-url"];return{url:e}}case"Loon":{let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}case"Quantumult X":{let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl,a=t["update-pasteboard"]||t.updatePasteboard;return{"open-url":e,"media-url":s,"update-pasteboard":a}}case"Node.js":return}default:return}};if(!this.isMute)switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:$notification.post(e,s,a,i(r));break;case"Quantumult X":$notify(e,s,a,i(r));break;case"Node.js":}if(!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),a&&t.push(a),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:this.log("",`❗️${this.name}, 错误!`,t);break;case"Node.js":this.log("",`❗️${this.name}, 错误!`,t.stack)}}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;switch(this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:$done(t);break;case"Node.js":process.exit(1)}}}(t,e)}