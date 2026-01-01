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
# 禁止上传APP信息
^https?:\/\/api\.mos\.csvw\.com\/mos\/security\/api\/v1\/mdm\/uploadDevice$ url reject-dict
^https?:\/\/api\.mos\.csvw\.com\/mos\/security\/api\/v1\/mdm\/updateAccount$ url reject-dict

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
        await csv.refreshSxToken();
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
            this.herders = {
                Authorization: "Bearer " + this.refreshToken,
                "Content-Type": "application/json; charset=utf-8",
                Did: this.did,
                deviceId: this.deviceid,
                'User-Agent': 'MosProject_Live/3 CFNetwork/1335.0.3 Darwin/21.6.0'
            };
        }

        getSignHeaders() {
            return {
                Authorization: this.Authorization,
                "X-COP-accessToken": this.userToken,
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
                this.Authorization = data?.tokenType + ' ' + data?.accessToken;
            }
            return code
        }

        async refreshSxToken() {
            const url = `https://api.mos.csvw.com/mos/operation/home/api/v2/users/${this.userId}/getSxToken?userId=${this.userId}`
            const headers = this.herders;
            const rest = {url, headers};
            const obj = await httpRequest(rest, '刷新userToken');
            this.userToken = obj?.data?.userToken;
            pushMsg(`刷新userToken:${obj?.description}` || `刷新userToken:${obj?.message}`);
        }

        // 签到
        async sign() {
            const url = 'https://mweb.mos.csvw.com/mos/operation/home/api/v3/user/sign/info';
            const body = `{"brand":"vw","idpId":"${this.openId}","userId":"${this.userId}"}`;
            const getOptions = () => {
                const headers = this.getSignHeaders();
                if (this.acw_sc__v2) {
                    headers['Cookie'] = `acw_sc__v2=${this.acw_sc__v2}`;
                }
                return { url, body, headers };
            };
            let obj = await httpRequest(getOptions(), '签到');
            let _msg;
            if (typeof obj === 'string' && obj.includes("arg1")) {
                const match = obj.match(/arg1='([^']*)'/);
                if (match && match[1]) {
                    this.acw_sc__v2 = getSignCookie(match[1]); // 计算新 Token
                    obj = await httpRequest(getOptions(), '签到重试');
                }
            }
            if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
                _msg = obj?.code == '000000' ? `签到:成功，已签到${obj?.data?.signCount}天` : `❌签到失败:${obj?.description}!`
            } else {
                _msg = "❌响应异常: 无法绕过阿里云防火墙";
            }
            pushMsg(_msg)
        }

        // 查积分
        async status() {
            const headers = this.getSignHeaders();
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

function getSignCookie(a){'use strict';const b="undefined"==typeof window?globalThis:window;b.Math||(b.Math=Math);const c={navigator:{webdriver:!1,userAgent:"Mozilla/5.0 (iPhone; CPU iPhone OS 11_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E302SVW IOS"},location:{}},d=a=>{const c=Math.floor(1+10*b.Math.random()),d=Math.ceil(a.length/c),e=[];for(let b=0;b<d;b++)for(let f=0;f<c;f++){const c=f*d+b;void 0!==a[c]&&e.push(a[c])}return e},e=a=>{const b=4294967296;let c=1830453227;return()=>(c=(1664525*c+a)%b,c/b)};let f=1606861126;const g=(a,b)=>{let c=b?1606861126:f;for(let d=0;d<a.length;d++)c=15*c+a[d].charCodeAt(0)>>>0;return b||(f=c),c},h="4068256048,2170782473,490712370",i=g(h);let j=a.slice(0,40).split("");Array.prototype.fill=function(){const a=d(this);return this.length=0,this.push(...a),b.Math.random=e(g(h)),this},b.Math.random=e(i),j.fill(48,35,40);let k=(a=>{let c=["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F"];for(let d=c.length-1;0<d;d--){const a=Math.floor(b.Math.random()*(d+1));[c[d],c[a]]=[c[a],c[d]]}return a.map(a=>c[parseInt(a,16)]).join("")})(j);const l=[c.navigator,c.navigator.webdriver,c.location,!0,!0];return l.forEach(a=>{let c=Math.floor(128*b.Math.random());(a&&0==c%2||!a&&0!=c%2)&&c++,k+=c.toString(16).padStart(2,"0")}),k=`197d84838-${k.toLowerCase()}`,k}

function intbase64(){CryptoJS=function(b){var g=function(){if(crypto){if("function"==typeof crypto.getRandomValues)try{return crypto.getRandomValues(new Uint32Array(1))[0]}catch(a){}if("function"==typeof crypto.randomBytes)try{return crypto.randomBytes(4).readInt32LE()}catch(a){}}throw new Error("Native crypto module could not be used to get secure random number.")},j=Object.create||function(){function a(){}return function(b){var c;return a.prototype=b,c=new a,a.prototype=null,c}}(),e={},i=e.lib={},k=i.Base={extend:function(a){var b=j(this);return a&&b.mixIn(a),b.hasOwnProperty("init")&&this.init!==b.init||(b.init=function(){b.$super.init.apply(this,arguments)}),b.init.prototype=b,b.$super=this,b},create:function(){var a=this.extend();return a.init.apply(a,arguments),a},init:function(){},mixIn:function(a){for(var b in a)a.hasOwnProperty(b)&&(this[b]=a[b]);a.hasOwnProperty("toString")&&(this.toString=a.toString)},clone:function(){return this.init.prototype.extend(this)}},l=i.WordArray=k.extend({init:function(a,b){a=this.words=a||[],this.sigBytes=null==b?4*a.length:b},toString:function(a){return(a||c).stringify(this)},concat:function(b){var c=this.words,d=b.words,f=this.sigBytes,e=b.sigBytes;if(this.clamp(),f%4)for(var g,h=0;h<e;h++)g=255&d[h>>>2]>>>24-8*(h%4),c[f+h>>>2]|=g<<24-8*((f+h)%4);else for(var i=0;i<e;i+=4)c[f+i>>>2]=d[i>>>2];return this.sigBytes+=e,this},clamp:function(){var a=this.words,c=this.sigBytes;a[c>>>2]&=4294967295<<32-8*(c%4),a.length=b.ceil(c/4)},clone:function(){var a=k.clone.call(this);return a.words=this.words.slice(0),a},random:function(a){var d,f=[],h=function(a){a=a;var c=987654321;return function(){var d=((c=36969*(65535&c)+(c>>16)&4294967295)<<16)+(a=18e3*(65535&a)+(a>>16)&4294967295)&4294967295;return d/=4294967296,(d+=.5)*(.5<b.random()?1:-1)}},i=!1;try{g(),i=!0}catch(a){}for(var j,k=0;k<a;k+=4)i?f.push(g()):(j=987654071*(d=h(4294967296*(j||b.random())))(),f.push(0|4294967296*d()));return new l.init(f,a)}}),a=e.enc={},c=a.Hex={stringify:function(a){for(var b,c=a.words,d=a.sigBytes,f=[],e=0;e<d;e++)b=255&c[e>>>2]>>>24-8*(e%4),f.push((b>>>4).toString(16)),f.push((15&b).toString(16));return f.join("")},parse:function(a){for(var b=a.length,c=[],d=0;d<b;d+=2)c[d>>>3]|=parseInt(a.substr(d,2),16)<<24-4*(d%8);return new l.init(c,b/2)}},m=a.Latin1={stringify:function(a){for(var b,c=a.words,d=a.sigBytes,f=[],e=0;e<d;e++)b=255&c[e>>>2]>>>24-8*(e%4),f.push(String.fromCharCode(b));return f.join("")},parse:function(a){for(var b=a.length,c=[],d=0;d<b;d++)c[d>>>2]|=(255&a.charCodeAt(d))<<24-8*(d%4);return new l.init(c,b)}},f=a.Utf8={stringify:function(a){try{return decodeURIComponent(escape(m.stringify(a)))}catch(a){throw new Error("Malformed UTF-8 data")}},parse:function(a){return m.parse(unescape(encodeURIComponent(a)))}},h=i.BufferedBlockAlgorithm=k.extend({reset:function(){this._data=new l.init,this._nDataBytes=0},_append:function(a){"string"==typeof a&&(a=f.parse(a)),this._data.concat(a),this._nDataBytes+=a.sigBytes},_process:function(a){var d,g=this._data,e=g.words,i=g.sigBytes,j=this.blockSize,k=i/(4*j),m=(k=a?b.ceil(k):b.max((0|k)-this._minBufferSize,0))*j,n=b.min(4*m,i);if(m){for(var f=0;f<m;f+=j)this._doProcessBlock(e,f);d=e.splice(0,m),g.sigBytes-=n}return new l.init(d,n)},clone:function(){var a=k.clone.call(this);return a._data=this._data.clone(),a},_minBufferSize:0}),o=(i.Hasher=h.extend({cfg:k.extend(),init:function(a){this.cfg=this.cfg.extend(a),this.reset()},reset:function(){h.reset.call(this),this._doReset()},update:function(a){return this._append(a),this._process(),this},finalize:function(a){return a&&this._append(a),this._doFinalize()},blockSize:16,_createHelper:function(a){return function(b,c){return new a.init(c).finalize(b)}},_createHmacHelper:function(a){return function(b,c){return new o.HMAC.init(a,c).finalize(b)}}}),e.algo={});return e}(Math),!function(){var a=CryptoJS,b=a.lib.WordArray;a.enc.Base64={stringify:function(b){var d=b.words,f=b.sigBytes,g=this._map;b.clamp();for(var e=[],h=0;h<f;h+=3)for(var i=(255&d[h>>>2]>>>24-8*(h%4))<<16|(255&d[h+1>>>2]>>>24-8*((h+1)%4))<<8|255&d[h+2>>>2]>>>24-8*((h+2)%4),j=0;4>j&&h+.75*j<f;j++)e.push(g.charAt(63&i>>>6*(3-j)));var k=g.charAt(64);if(k)for(;e.length%4;)e.push(k);return e.join("")},parse:function(c){var d=c.length,f=this._map,e=this._reverseMap;if(!e){e=this._reverseMap=[];for(var g=0;g<f.length;g++)e[f.charCodeAt(g)]=g}var h=f.charAt(64);if(h){var j=c.indexOf(h);-1!==j&&(d=j)}return function(d,f,g){for(var e=[],h=0,i=0;i<f;i++)if(i%4){var j=g[d.charCodeAt(i-1)]<<2*(i%4),a=g[d.charCodeAt(i)]>>>6-2*(i%4);e[h>>>2]|=(j|a)<<24-8*(h%4),h++}return b.create(e,h)}(c,d,e)},_map:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="}}()}

function ObjectKeys2LowerCase(obj){return Object.fromEntries(Object.entries(obj).map(([k,v])=>[k.toLowerCase(),v]))};
//通知
async function sendMsg(message){if(!message)return;try{if($.isNode()){try{var notify=require('./sendNotify');}catch(e){var notify=require('./utils/sendNotify');}await notify.sendNotify($.name,message);}else{$.msg($.name,'',message);}}catch(e){$.log(`\n\n-----${$.name}-----\n${message}`);}};

function getEnv(...keys){for(let key of keys){var value=$.isNode()?process.env[key]||process.env[key.toUpperCase()]||process.env[key.toLowerCase()]||$.getdata(key):$.getdata(key);if(value)return value;}};

//*****************************
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,a)=>{s.call(this,t,(t,s,r)=>{t?a(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.encoding="utf-8",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}getEnv(){return"undefined"!=typeof $environment&&$environment["surge-version"]?"Surge":"undefined"!=typeof $environment&&$environment["stash-version"]?"Stash":"undefined"!=typeof module&&module.exports?"Node.js":"undefined"!=typeof $task?"Quantumult X":"undefined"!=typeof $loon?"Loon":"undefined"!=typeof $rocket?"Shadowrocket":void 0}isNode(){return"Node.js"===this.getEnv()}isQuanX(){return"Quantumult X"===this.getEnv()}isSurge(){return"Surge"===this.getEnv()}isLoon(){return"Loon"===this.getEnv()}isShadowrocket(){return"Shadowrocket"===this.getEnv()}isStash(){return"Stash"===this.getEnv()}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const a=this.getdata(t);if(a)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,a)=>e(a))})}runScript(t,e){return new Promise(s=>{let a=this.getdata("@chavy_boxjs_userCfgs.httpapi");a=a?a.replace(/\n/g,"").trim():a;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[i,o]=a.split("@"),n={url:`http://${o}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":i,Accept:"*/*"},timeout:r};this.post(n,(t,e,a)=>s(a))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),a=!s&&this.fs.existsSync(e);if(!s&&!a)return{};{const a=s?t:e;try{return JSON.parse(this.fs.readFileSync(a))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),a=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):a?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const a=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of a)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,a)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[a+1])>>0==+e[a+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,a]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,a,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,a,r]=/^@(.*?)\.(.*?)$/.exec(e),i=this.getval(a),o=a?"null"===i?null:i||"{}":"{}";try{const e=JSON.parse(o);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),a)}catch(e){const i={};this.lodash_set(i,r,t),s=this.setval(JSON.stringify(i),a)}}else s=this.setval(t,e);return s}getval(t){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.read(t);case"Quantumult X":return $prefs.valueForKey(t);case"Node.js":return this.data=this.loaddata(),this.data[t];default:return this.data&&this.data[t]||null}}setval(t,e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.write(t,e);case"Quantumult X":return $prefs.setValueForKey(t,e);case"Node.js":return this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0;default:return this.data&&this.data[e]||null}}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){switch(t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"],delete t.headers["content-type"],delete t.headers["content-length"]),t.params&&(t.url+="?"+this.queryStr(t.params)),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,a)=>{!t&&s&&(s.body=a,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,a)});break;case"Quantumult X":this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:a,headers:r,body:i,bodyBytes:o}=t;e(null,{status:s,statusCode:a,headers:r,body:i,bodyBytes:o},i,o)},t=>e(t&&t.error||"UndefinedError"));break;case"Node.js":let s=require("iconv-lite");this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:a,statusCode:r,headers:i,rawBody:o}=t,n=s.decode(o,this.encoding);e(null,{status:a,statusCode:r,headers:i,rawBody:o,body:n},n)},t=>{const{message:a,response:r}=t;e(a,r,r&&s.decode(r.rawBody,this.encoding))})}}post(t,e=(()=>{})){const s=t.method?t.method.toLocaleLowerCase():"post";switch(t.body&&t.headers&&!t.headers["Content-Type"]&&!t.headers["content-type"]&&(t.headers["content-type"]="application/x-www-form-urlencoded"),t.headers&&(delete t.headers["Content-Length"],delete t.headers["content-length"]),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient[s](t,(t,s,a)=>{!t&&s&&(s.body=a,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,a)});break;case"Quantumult X":t.method=s,this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:a,headers:r,body:i,bodyBytes:o}=t;e(null,{status:s,statusCode:a,headers:r,body:i,bodyBytes:o},i,o)},t=>e(t&&t.error||"UndefinedError"));break;case"Node.js":let a=require("iconv-lite");this.initGotEnv(t);const{url:r,...i}=t;this.got[s](r,i).then(t=>{const{statusCode:s,statusCode:r,headers:i,rawBody:o}=t,n=a.decode(o,this.encoding);e(null,{status:s,statusCode:r,headers:i,rawBody:o,body:n},n)},t=>{const{message:s,response:r}=t;e(s,r,r&&a.decode(r.rawBody,this.encoding))})}}time(t,e=null){const s=e?new Date(e):new Date;let a={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in a)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?a[e]:("00"+a[e]).substr((""+a[e]).length)));return t}queryStr(t){let e="";for(const s in t){let a=t[s];null!=a&&""!==a&&("object"==typeof a&&(a=JSON.stringify(a)),e+=`${s}=${a}&`)}return e=e.substring(0,e.length-1),e}msg(e=t,s="",a="",r){const i=t=>{switch(typeof t){case void 0:return t;case"string":switch(this.getEnv()){case"Surge":case"Stash":default:return{url:t};case"Loon":case"Shadowrocket":return t;case"Quantumult X":return{"open-url":t};case"Node.js":return}case"object":switch(this.getEnv()){case"Surge":case"Stash":case"Shadowrocket":default:{let e=t.url||t.openUrl||t["open-url"];return{url:e}}case"Loon":{let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}case"Quantumult X":{let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl,a=t["update-pasteboard"]||t.updatePasteboard;return{"open-url":e,"media-url":s,"update-pasteboard":a}}case"Node.js":return}default:return}};if(!this.isMute)switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:$notification.post(e,s,a,i(r));break;case"Quantumult X":$notify(e,s,a,i(r));break;case"Node.js":}if(!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),a&&t.push(a),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:this.log("",`❗️${this.name}, 错误!`,t);break;case"Node.js":this.log("",`❗️${this.name}, 错误!`,t.stack)}}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;switch(this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:$done(t);break;case"Node.js":process.exit(1)}}}(t,e)}