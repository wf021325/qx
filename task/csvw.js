/*
上汽大众APP 签到
仅测试qx,理论支持surge,loon等等

获取ck只能旧版   旧版2.7.1 版本id:845914109
先登录新版，再覆盖安装旧版，或者直接登录旧版。每次打开旧版APP能获得签到ck，新版无法mitm，但是这个ck有效期应该很久。
自己要用更新到新版即可，随便覆盖安装，只要不退出账号ck应该就有效。

======调试区|忽略======
# ^https?:\/\/api\.mos\.csvw\.com\/mos\/security\/api\/v1\/app\/at\/actions\/refresh$ url script-request-header http://192.168.2.170:8080/csvw.js
======调试区|忽略======

====================================
[rewrite_local]
^https?:\/\/api\.mos\.csvw\.com\/mos\/security\/api\/v1\/app\/at\/actions\/refresh$ url script-request-header https://raw.githubusercontent.com/wf021325/qx/master/task/csvw.js
# 这是屏蔽旧版APP弹出更新的，开启重写可以使用旧版
^https?:\/\/api\.mos\.csvw\.com\/mos\/app-update\/api\/v1\/app\/update$ url reject-dict

[task_local]
1 0 * * * https://raw.githubusercontent.com/wf021325/qx/master/task/csvw.js, tag=上汽大众, enabled=true

[mitm]
hostname = api.mos.csvw.com
====================================

----------------------
青龙环境变量
csvw_data={"deviceid":"XXXXXXXX","did":"VW_APP_iPhone_xxxxxxxxxxx_17.0.0_2.7.1","token":"eyJxxxxx.eyJxxxxx.xxxxx"}

旧版2.7.1版本抓包找到 https://api.mos.csvw.com/mos/security/api/v1/app/at/actions/refresh
deviceid -----> request-headers.deviceId
did -----> request-headers.Did
token -----> request-headers.Authorization(用这个要去掉'Bearer ') 或者 request-body.refreshToken  或者 response-body.data.refreshToken,他们三个值一样
---------------------
 */

const $ = new Env("上汽大众");
const _key = 'csvw_data';
$.huihui = $.toObj(getEnv(_key)) || {};
//$.log($.toStr($.huihui))
$.is_debug = 'true-';
$.messages = [];

async function main() {
    var csv = new csvw($.huihui);
    var code = await csv.refresh();
    if (code == '000000') {
        await csv.sign();
        await csv.status();
    }
}

function csvw(obj) {
    return new (class {
        constructor(obj) {
            obj = obj || {};
            this.refreshToken = obj.token || '';
            this.did = obj.did || '';
            this.deviceid = obj.deviceid || '';
            const refreshToken = this.refreshToken ? "Bearer " + this.refreshToken : '';
            this.herders = {
                Authorization: refreshToken,
                "Content-Type": "application/json; charset=utf-8",
                Did: this.did,
                deviceId: this.deviceid,
                'User-Agent': 'MosProject_Live/3 CFNetwork/1335.0.3 Darwin/21.6.0'
            };
        }

        getSignHeaders(Authorization = '', userToken = '0') {
            return {
                Authorization,
                "X-COP-accessToken": userToken,
                "Content-Type": "application/json",
                Did: this.did,
                deviceId: this.deviceid,
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 11_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E302SVW IOS"
            };
        }

        getid() {
            if (this.refreshToken) {
                const obj = $.toObj(CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(this.refreshToken.split('.')[1])));
                this.openId = obj.ssoid;
                this.userId = obj.sub;
            }
        }

        //获取临时Token
        async refresh() {
            this.getid();
            const url = `https://api.mos.csvw.com/mos/security/api/v1/app/at/actions/refresh`;
            const body = `{"refreshToken":"${this.refreshToken}","scope":"user"}`;
            const headers = this.herders;
            const rest = {url, body, headers, method: 'PUT'};
            const {code, data, description} = await httpRequest(rest, '获取临时Token ');
            pushMsg(`获取临时Token:${description}`);
            if (code == '000000') {
                this.Sign_token = data?.tokenType + ' ' + data?.accessToken;
            }
            return code
        }

        async refreshSxToken() {
            const url = `https://api.mos.csvw.com/mos/operation/home/api/v2/users/${this.userId}/getSxToken?userId=${this.userId}`
            const headers = this.getHeaders(this.Sign_token);
            const rest = {url, headers};
            const obj = await httpRequest(rest, '刷新userToken');
            this.userToken = obj?.data?.userToken;
            pushMsg(`刷新userToken:${obj?.description}` || `刷新userToken:${obj?.message}`);
        }

        // 签到
        async sign() {
            const body = `{"activityId":"MOS_SX_Sign_1001","brand":"VW","idpId":"${this.openId}","userId":"${this.userId}"}`;
            const headers = this.getSignHeaders(this.Sign_token, this.userToken);
            const url = 'https://mweb.mos.csvw.com/mos-mweb/app-misc/api/home/api/v1/user/sign/info';
            const rest = {url, body, headers};
            const obj = await httpRequest(rest, '签到');
            let _msg;
            _msg = obj?.code == '000000' ? `签到:成功，已签到${obj?.data?.signCount}天` : `❌签到失败:${obj?.description}!`
            pushMsg(_msg)
        }

        // 查积分
        async status() {
            const headers = this.getSignHeaders(this.Sign_token, this.userToken);
            const url = `https://mweb.mos.csvw.com/mos-mweb/app-misc/api/user/api/v1/app/member/social/info/users/${this.userId}`;
            const rest = {url, headers};
            const obj = await httpRequest(rest, '查积分');
            let _msg;
            obj?.code == '000000' ? _msg = `当前积分:${obj?.data?.pointCount}` : `❌${obj?.data}`
            pushMsg(_msg)
        }

    })(obj)
}

//取ck
function getCk() {
    if ($request && $request.method != 'OPTIONS') {
        const obj = ObjectKeys2LowerCase($request.headers);
        const deviceid = obj.deviceid;
        const did = obj.did;
        const token = obj.authorization.replace(/^Bearer\s*/, '');
        const ckVal = $.toStr({deviceid, did, token});
        $.setdata(ckVal, _key)
        $.msg($.name, '', '获取签到数据成功🎉\n' + ckVal)
    }
}

// 脚本执行入口
!(async () => {
    typeof $request !== `undefined` ? await getCk() : (intbase64(), await main());  // 主函数
})().catch((e) => $.messages.push(e.message || e) && $.logErr(e))
    .finally(async () => {
        await sendMsg($.messages.join('\n').trimStart().trimEnd());  // 推送通知
        $.done();
    })


async function httpRequest(options, 调试备注) {
    !(调试备注) ? 调试备注 = '' : "-"
    try {
        options = options.url ? options : {url: options};
        const _method = options?._method || ('body' in options ? 'post' : 'get');
        const _respType = options?._respType || 'body';
        const _timeout = options?._timeout || 15e3;
        const _http = [
            new Promise((_, reject) => setTimeout(() => reject(`⛔️ 请求超时: ${options['url']}`), _timeout)),
            new Promise((resolve, reject) => {
                debug(options, 调试备注 + '[Request]');
                $[_method.toLowerCase()](options, (error, response, data) => {
                    //debug(response, '[response]');
                    debug(data, 调试备注 + '[响应body]');
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

function pushMsg(msg) {
    $.messages.push(msg.trimEnd()), $.log(msg.trimEnd());
}

//DEBUG
function debug(content, title = "debug") {
    let start = `┌---------------↓↓${title}↓↓---------------\n`;
    let end = `\n└---------------↑↑${$.time('HH:mm:ss')}↑↑---------------`;
    if ($.is_debug === 'true') {
        if (typeof content == "string") {
            $.log(start + content.replace(/\s+/g, '') + end);
            //$.log(start + content + end);
        } else if (typeof content == "object") {
            $.log(start + $.toStr(content) + end);
        }
    }
};

function intbase64(){CryptoJS=function(t,n){var r=function(){if(crypto){if("function"==typeof crypto.getRandomValues)try{return crypto.getRandomValues(new Uint32Array(1))[0]}catch(t){}if("function"==typeof crypto.randomBytes)try{return crypto.randomBytes(4).readInt32LE()}catch(t){}}throw new Error("Native crypto module could not be used to get secure random number.")},e=Object.create||function(){function t(){}return function(n){var r;return t.prototype=n,r=new t,t.prototype=null,r}}(),i={},o=i.lib={},s=o.Base={extend:function(t){var n=e(this);return t&&n.mixIn(t),n.hasOwnProperty("init")&&this.init!==n.init||(n.init=function(){n.$super.init.apply(this,arguments)}),n.init.prototype=n,n.$super=this,n},create:function(){var t=this.extend();return t.init.apply(t,arguments),t},init:function(){},mixIn:function(t){for(var n in t)t.hasOwnProperty(n)&&(this[n]=t[n]);t.hasOwnProperty("toString")&&(this.toString=t.toString)},clone:function(){return this.init.prototype.extend(this)}},a=o.WordArray=s.extend({init:function(t,n){t=this.words=t||[],this.sigBytes=null!=n?n:4*t.length},toString:function(t){return(t||u).stringify(this)},concat:function(t){var n=this.words,r=t.words,e=this.sigBytes,i=t.sigBytes;if(this.clamp(),e%4)for(var o=0;o<i;o++){var s=r[o>>>2]>>>24-o%4*8&255;n[e+o>>>2]|=s<<24-(e+o)%4*8}else for(var a=0;a<i;a+=4)n[e+a>>>2]=r[a>>>2];return this.sigBytes+=i,this},clamp:function(){var n=this.words,r=this.sigBytes;n[r>>>2]&=4294967295<<32-r%4*8,n.length=t.ceil(r/4)},clone:function(){var t=s.clone.call(this);return t.words=this.words.slice(0),t},random:function(n){var e,i=[],o=function(n){n=n;var r=987654321,e=4294967295;return function(){var i=((r=36969*(65535&r)+(r>>16)&e)<<16)+(n=18e3*(65535&n)+(n>>16)&e)&e;return i/=4294967296,(i+=.5)*(t.random()>.5?1:-1)}},s=!1;try{r(),s=!0}catch(t){}for(var c,u=0;u<n;u+=4)s?i.push(r()):(c=987654071*(e=o(4294967296*(c||t.random())))(),i.push(4294967296*e()|0));return new a.init(i,n)}}),c=i.enc={},u=c.Hex={stringify:function(t){for(var n=t.words,r=t.sigBytes,e=[],i=0;i<r;i++){var o=n[i>>>2]>>>24-i%4*8&255;e.push((o>>>4).toString(16)),e.push((15&o).toString(16))}return e.join("")},parse:function(t){for(var n=t.length,r=[],e=0;e<n;e+=2)r[e>>>3]|=parseInt(t.substr(e,2),16)<<24-e%8*4;return new a.init(r,n/2)}},f=c.Latin1={stringify:function(t){for(var n=t.words,r=t.sigBytes,e=[],i=0;i<r;i++){var o=n[i>>>2]>>>24-i%4*8&255;e.push(String.fromCharCode(o))}return e.join("")},parse:function(t){for(var n=t.length,r=[],e=0;e<n;e++)r[e>>>2]|=(255&t.charCodeAt(e))<<24-e%4*8;return new a.init(r,n)}},h=c.Utf8={stringify:function(t){try{return decodeURIComponent(escape(f.stringify(t)))}catch(t){throw new Error("Malformed UTF-8 data")}},parse:function(t){return f.parse(unescape(encodeURIComponent(t)))}},p=o.BufferedBlockAlgorithm=s.extend({reset:function(){this._data=new a.init,this._nDataBytes=0},_append:function(t){"string"==typeof t&&(t=h.parse(t)),this._data.concat(t),this._nDataBytes+=t.sigBytes},_process:function(n){var r,e=this._data,i=e.words,o=e.sigBytes,s=this.blockSize,c=o/(4*s),u=(c=n?t.ceil(c):t.max((0|c)-this._minBufferSize,0))*s,f=t.min(4*u,o);if(u){for(var h=0;h<u;h+=s)this._doProcessBlock(i,h);r=i.splice(0,u),e.sigBytes-=f}return new a.init(r,f)},clone:function(){var t=s.clone.call(this);return t._data=this._data.clone(),t},_minBufferSize:0}),d=(o.Hasher=p.extend({cfg:s.extend(),init:function(t){this.cfg=this.cfg.extend(t),this.reset()},reset:function(){p.reset.call(this),this._doReset()},update:function(t){return this._append(t),this._process(),this},finalize:function(t){return t&&this._append(t),this._doFinalize()},blockSize:16,_createHelper:function(t){return function(n,r){return new t.init(r).finalize(n)}},_createHmacHelper:function(t){return function(n,r){return new d.HMAC.init(t,r).finalize(n)}}}),i.algo={});return i}(Math);!function(){var t=CryptoJS,n=t.lib.WordArray;t.enc.Base64={stringify:function(t){var n=t.words,r=t.sigBytes,e=this._map;t.clamp();for(var i=[],o=0;o<r;o+=3)for(var s=(n[o>>>2]>>>24-o%4*8&255)<<16|(n[o+1>>>2]>>>24-(o+1)%4*8&255)<<8|n[o+2>>>2]>>>24-(o+2)%4*8&255,a=0;a<4&&o+.75*a<r;a++)i.push(e.charAt(s>>>6*(3-a)&63));var c=e.charAt(64);if(c)for(;i.length%4;)i.push(c);return i.join("")},parse:function(t){var r=t.length,e=this._map,i=this._reverseMap;if(!i){i=this._reverseMap=[];for(var o=0;o<e.length;o++)i[e.charCodeAt(o)]=o}var s=e.charAt(64);if(s){var a=t.indexOf(s);-1!==a&&(r=a)}return function(t,r,e){for(var i=[],o=0,s=0;s<r;s++)if(s%4){var a=e[t.charCodeAt(s-1)]<<s%4*2,c=e[t.charCodeAt(s)]>>>6-s%4*2;i[o>>>2]|=(a|c)<<24-o%4*8,o++}return n.create(i,o)}(t,r,i)},_map:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="}}();}
function ObjectKeys2LowerCase(obj){return Object.fromEntries(Object.entries(obj).map(([k,v])=>[k.toLowerCase(),v]))};
//通知
async function sendMsg(message){if(!message)return;try{if($.isNode()){try{var notify=require('./sendNotify');}catch(e){var notify=require('./utils/sendNotify');}await notify.sendNotify($.name,message);}else{$.msg($.name,'',message);}}catch(e){$.log(`\n\n-----${$.name}-----\n${message}`);}};

function getEnv(...keys){for(let key of keys){var value=$.isNode()?process.env[key]||process.env[key.toUpperCase()]||process.env[key.toLowerCase()]||$.getdata(key):$.getdata(key);if(value)return value;}};

//*****************************
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,a)=>{s.call(this,t,(t,s,r)=>{t?a(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.encoding="utf-8",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}getEnv(){return"undefined"!=typeof $environment&&$environment["surge-version"]?"Surge":"undefined"!=typeof $environment&&$environment["stash-version"]?"Stash":"undefined"!=typeof module&&module.exports?"Node.js":"undefined"!=typeof $task?"Quantumult X":"undefined"!=typeof $loon?"Loon":"undefined"!=typeof $rocket?"Shadowrocket":void 0}isNode(){return"Node.js"===this.getEnv()}isQuanX(){return"Quantumult X"===this.getEnv()}isSurge(){return"Surge"===this.getEnv()}isLoon(){return"Loon"===this.getEnv()}isShadowrocket(){return"Shadowrocket"===this.getEnv()}isStash(){return"Stash"===this.getEnv()}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const a=this.getdata(t);if(a)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,a)=>e(a))})}runScript(t,e){return new Promise(s=>{let a=this.getdata("@chavy_boxjs_userCfgs.httpapi");a=a?a.replace(/\n/g,"").trim():a;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[i,o]=a.split("@"),n={url:`http://${o}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":i,Accept:"*/*"},timeout:r};this.post(n,(t,e,a)=>s(a))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),a=!s&&this.fs.existsSync(e);if(!s&&!a)return{};{const a=s?t:e;try{return JSON.parse(this.fs.readFileSync(a))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),a=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):a?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const a=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of a)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,a)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[a+1])>>0==+e[a+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,a]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,a,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,a,r]=/^@(.*?)\.(.*?)$/.exec(e),i=this.getval(a),o=a?"null"===i?null:i||"{}":"{}";try{const e=JSON.parse(o);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),a)}catch(e){const i={};this.lodash_set(i,r,t),s=this.setval(JSON.stringify(i),a)}}else s=this.setval(t,e);return s}getval(t){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.read(t);case"Quantumult X":return $prefs.valueForKey(t);case"Node.js":return this.data=this.loaddata(),this.data[t];default:return this.data&&this.data[t]||null}}setval(t,e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.write(t,e);case"Quantumult X":return $prefs.setValueForKey(t,e);case"Node.js":return this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0;default:return this.data&&this.data[e]||null}}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){switch(t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"],delete t.headers["content-type"],delete t.headers["content-length"]),t.params&&(t.url+="?"+this.queryStr(t.params)),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,a)=>{!t&&s&&(s.body=a,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,a)});break;case"Quantumult X":this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:a,headers:r,body:i,bodyBytes:o}=t;e(null,{status:s,statusCode:a,headers:r,body:i,bodyBytes:o},i,o)},t=>e(t&&t.error||"UndefinedError"));break;case"Node.js":let s=require("iconv-lite");this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:a,statusCode:r,headers:i,rawBody:o}=t,n=s.decode(o,this.encoding);e(null,{status:a,statusCode:r,headers:i,rawBody:o,body:n},n)},t=>{const{message:a,response:r}=t;e(a,r,r&&s.decode(r.rawBody,this.encoding))})}}post(t,e=(()=>{})){const s=t.method?t.method.toLocaleLowerCase():"post";switch(t.body&&t.headers&&!t.headers["Content-Type"]&&!t.headers["content-type"]&&(t.headers["content-type"]="application/x-www-form-urlencoded"),t.headers&&(delete t.headers["Content-Length"],delete t.headers["content-length"]),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient[s](t,(t,s,a)=>{!t&&s&&(s.body=a,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,a)});break;case"Quantumult X":t.method=s,this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:a,headers:r,body:i,bodyBytes:o}=t;e(null,{status:s,statusCode:a,headers:r,body:i,bodyBytes:o},i,o)},t=>e(t&&t.error||"UndefinedError"));break;case"Node.js":let a=require("iconv-lite");this.initGotEnv(t);const{url:r,...i}=t;this.got[s](r,i).then(t=>{const{statusCode:s,statusCode:r,headers:i,rawBody:o}=t,n=a.decode(o,this.encoding);e(null,{status:s,statusCode:r,headers:i,rawBody:o,body:n},n)},t=>{const{message:s,response:r}=t;e(s,r,r&&a.decode(r.rawBody,this.encoding))})}}time(t,e=null){const s=e?new Date(e):new Date;let a={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in a)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?a[e]:("00"+a[e]).substr((""+a[e]).length)));return t}queryStr(t){let e="";for(const s in t){let a=t[s];null!=a&&""!==a&&("object"==typeof a&&(a=JSON.stringify(a)),e+=`${s}=${a}&`)}return e=e.substring(0,e.length-1),e}msg(e=t,s="",a="",r){const i=t=>{switch(typeof t){case void 0:return t;case"string":switch(this.getEnv()){case"Surge":case"Stash":default:return{url:t};case"Loon":case"Shadowrocket":return t;case"Quantumult X":return{"open-url":t};case"Node.js":return}case"object":switch(this.getEnv()){case"Surge":case"Stash":case"Shadowrocket":default:{let e=t.url||t.openUrl||t["open-url"];return{url:e}}case"Loon":{let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}case"Quantumult X":{let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl,a=t["update-pasteboard"]||t.updatePasteboard;return{"open-url":e,"media-url":s,"update-pasteboard":a}}case"Node.js":return}default:return}};if(!this.isMute)switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:$notification.post(e,s,a,i(r));break;case"Quantumult X":$notify(e,s,a,i(r));break;case"Node.js":}if(!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),a&&t.push(a),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:this.log("",`❗️${this.name}, 错误!`,t);break;case"Node.js":this.log("",`❗️${this.name}, 错误!`,t.stack)}}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;switch(this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:$done(t);break;case"Node.js":process.exit(1)}}}(t,e)}