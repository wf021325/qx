/*
极氪汽车签到
仅QX，nodejs测试，其他自测
2024-06-19
获取Token方法 : 进入APP获得

======调试区|忽略======
# ^https:\/\/api-gw-toc\.zeekrlife\.com\/zeekrlife-app-user\/v\d\/user\/info\/query$ url script-request-header http://192.168.2.170:8080/zeekr.js
======调试区|忽略======

====================================
[rewrite_local]
^https:\/\/api-gw-toc\.zeekrlife\.com\/zeekrlife-app-user\/v\d\/user\/info\/query$ url script-response-body https://raw.githubusercontent.com/wf021325/qx/master/task/zeekr.js

[task_local]
1 0 * * * https://raw.githubusercontent.com/wf021325/qx/master/task/zeekr.js, tag= 极氪汽车签到, enabled=true

[mitm]
hostname = api-gw-toc.zeekrlife.com
====================================

# 青龙环境变量  zeekr_val = '{"authorization":"Bearer eyxxxx.eyxxxx.xxxxxx"}'
 */

const $ = new Env("极氪汽车");
const _key = 'zeekr_val';
$.CK_Val = $.toObj(getEnv(_key));
$.is_debug = getEnv('is_debug') || 'false';  // 调试模式
$.messages = [];

function getCk() {
    if ($request && $request.method != 'OPTIONS') {
        const header = ObjectKeys2LowerCase($request.headers);
        const authorization = header?.authorization;
        if (authorization) {
            const ckVal = $.toStr({authorization});
            $.setdata(ckVal, _key);
            $.msg($.name, '获取Token成功🎉', ckVal);
        } else {
             $.msg($.name, '', '❌获取Token失败');
        }
    }
}

async function main() {
    intSHA1();
    $.appversion = $.toObj((await $.http.get(`https://itunes.apple.com/cn/lookup?id=1570277888`))?.body)?.results[0]?.version;
    $.log(`最新版本号：${$.appversion}`)
    await getsignIn($.CK_Val?.authorization);
}

async function getsignIn(authorization) {
    const rest = {
        url: 'https://api-gw-toc.zeekrlife.com/zeekrlife-mp-val/toc/v1/zgreen/center',
        body: '{}',
        headers: {
            ...gethead(),
            'Eagleeye-Sessionid': '',
            'app_code': 'toc_h5_green_zeekrapp',
            "Eagleeye-Traceid": '',
            'Authorization': authorization
        }
    };
    var obj = await Request(rest);
    (obj.code === '000000') ?
        msg = (obj?.data?.first) ?
            `签到:签到成功\n` :
            `签到:${obj?.data?.signInZgreenInfo[1]?.taskName}\n` :
        msg = `签到:${obj?.msg}\n`
    $.messages.push(msg), $.log(msg);
}
//{"success":true,"code":"000000","data":{"first":true,"acceptResult":{"isCarUser":false,"isAcceptDriveAgreement":false,"isAcceptWalkAgreement":false},"lastDayWalkTime":{"yesterdayStartTime":"1718640000000","yesterdayEndTime":"1718726399999","isDayLight":true}}}

function gethead() {
    x_ca_timestamp = Math.floor((new Date).getTime());
    x_ca_nonce = getRandomString(15);
    x_ca_sign = CryptoJS.SHA1(['MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCz09z6e9WOcNq+nUMX8Vq1Xe2EmJxuR3XbturefioF)E(Fl', x_ca_nonce, x_ca_timestamp].sort().join("")).toString();
    appversion = $.appversion || '4.1.1';
    return {
        x_ca_key: "H5-SIGN-SECRET-KEY",
        platform: '',
        app_type: 'h5',
        x_ca_nonce: x_ca_nonce,
        x_ca_timestamp: x_ca_timestamp,
        x_ca_sign: x_ca_sign,
        WorkspaceId: 'prod',
        Version: 2,
        //device_id: '99762632568265303279',
        riskTimeStamp: (new Date).getTime(),
        AppId: 'ONEX97FB91F061405',
        "Content-Type": "application/json",
        'X-CORS-ONEX97FB91F061405-prod': '1',
        'User-Agent': `Mozilla/5.0 (iPhone; CPU iPhone OS 17_0_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) zeekr_iOS_v${appversion}`
    }
}


/*
const x_ca_sign = CryptoJS.SHA1(x_ca_timestamp + x_ca_nonce + x_ca_secret).toString();
const So = {
    uat: {
        VUE_APP_API: "https://api-gateway-uat.lkhaowu.com",
        REACT_APP_MOLE: "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCz09z6e9WOcNq+nUMX8Vq1Xe2EmJxuR3Xbture",
        VUE_APP_HELLO: "H5-SIGN-SECRET-KEY",
        REACT_APP_MPAAS_API: "https://mgw.mpaas.cn-hangzhou.aliyuncs.com/mgw.htm",
        REACT_APP_MPAAS_WORLD: "ONEX97FB91F061405",
        REACT_APP_BUILD_TYPE: "uat",
        VUE_APP_MSE_URL: "https://api-gw-toc-uat.lkhaowu.com"
    }, test: {
        VUE_APP_API: "https://api-gateway-test.lkhaowu.com",
        REACT_APP_MOLE: "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCz09z6e9WOcNq+nUMX8Vq1Xe2EmJxuR3Xbture",
        VUE_APP_HELLO: "H5-SIGN-SECRET-KEY",
        REACT_APP_MPAAS_API: "https://mgw.mpaas.cn-hangzhou.aliyuncs.com/mgw.htm",
        REACT_APP_MPAAS_WORLD: "ONEX97FB91F061405",
        REACT_APP_BUILD_TYPE: "test",
        VUE_APP_MSE_URL: "https://api-gw-toc-test.lkhaowu.com"
    }, prod: {
        VUE_APP_API: "https://api-gateway.zeekrlife.com",
        REACT_APP_MOLE: "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCz09z6e9WOcNq+nUMX8Vq1Xe2EmJxuR3XbturefioF)E(Fl",
        VUE_APP_HELLO: "H5-SIGN-SECRET-KEY",
        REACT_APP_MPAAS_API: "https://mgw.mpaas.cn-hangzhou.aliyuncs.com/mgw.htm",
        REACT_APP_MPAAS_WORLD: "ONEX97FB91F061405",
        REACT_APP_BUILD_TYPE: "prod",
        VUE_APP_MSE_URL: "https://api-gw-toc.zeekrlife.com"
    }, pre: {
        VUE_APP_API: "https://api-gateway-pre.lkhaowu.com",
        REACT_APP_MOLE: "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCz09z6e9WOcNq+nUMX8Vq1Xe2EmJxuR3Xbture",
        VUE_APP_HELLO: "H5-SIGN-SECRET-KEY",
        REACT_APP_MPAAS_API: "https://mgw.mpaas.cn-hangzhou.aliyuncs.com/mgw.htm",
        REACT_APP_MPAAS_WORLD: "ONEX97FB91F061405",
        REACT_APP_BUILD_TYPE: "pre",
        VUE_APP_MSE_URL: "https://api-gw-toc-pre.lkhaowu.com"
    }
};*/

// 脚本执行入口
!(async () => {
    if (typeof $request !== `undefined`) {
        getCk();
    } else {
        if (!$.CK_Val) throw new Error('❌请先获取Token🎉')
        await main();
    }
})()
    .catch((e) => $.messages.push(e.message || e) && $.logErr(e))
    .finally(async () => {
        await sendMsg($.messages.join('\n').trimStart().trimEnd());  // 推送通知
        $.done();
    })

//nonce 随机
function getRandomString(n=32){const t="ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz1234567890";return Array.from({length:n},()=>t[Math.floor(Math.random()*t.length)]).join("")}

//SHA1
function intSHA1(){CryptoJS=function(t,n){var r=function(){throw new Error("Native crypto module could not be used to get secure random number.")},i=Object.create||function(){function t(){}return function(n){var r;return t.prototype=n,r=new t,t.prototype=null,r}}(),e={},o=e.lib={},s=o.Base={extend:function(t){var n=i(this);return t&&n.mixIn(t),n.hasOwnProperty("init")&&this.init!==n.init||(n.init=function(){n.$super.init.apply(this,arguments)}),n.init.prototype=n,n.$super=this,n},create:function(){var t=this.extend();return t.init.apply(t,arguments),t},init:function(){},mixIn:function(t){for(var n in t)t.hasOwnProperty(n)&&(this[n]=t[n]);t.hasOwnProperty("toString")&&(this.toString=t.toString)},clone:function(){return this.init.prototype.extend(this)}},a=o.WordArray=s.extend({init:function(t,n){t=this.words=t||[],this.sigBytes=null!=n?n:4*t.length},toString:function(t){return(t||u).stringify(this)},concat:function(t){var n=this.words,r=t.words,i=this.sigBytes,e=t.sigBytes;if(this.clamp(),i%4)for(var o=0;o<e;o++){var s=r[o>>>2]>>>24-o%4*8&255;n[i+o>>>2]|=s<<24-(i+o)%4*8}else for(var a=0;a<e;a+=4)n[i+a>>>2]=r[a>>>2];return this.sigBytes+=e,this},clamp:function(){var n=this.words,r=this.sigBytes;n[r>>>2]&=4294967295<<32-r%4*8,n.length=t.ceil(r/4)},clone:function(){var t=s.clone.call(this);return t.words=this.words.slice(0),t},random:function(n){var i,e=[],o=function(n){n=n;var r=987654321,i=4294967295;return function(){var e=((r=36969*(65535&r)+(r>>16)&i)<<16)+(n=18e3*(65535&n)+(n>>16)&i)&i;return e/=4294967296,(e+=.5)*(t.random()>.5?1:-1)}},s=!1;try{r(),s=!0}catch(t){}for(var c,u=0;u<n;u+=4)s?e.push(r()):(c=987654071*(i=o(4294967296*(c||t.random())))(),e.push(4294967296*i()|0));return new a.init(e,n)}}),c=e.enc={},u=c.Hex={stringify:function(t){for(var n=t.words,r=t.sigBytes,i=[],e=0;e<r;e++){var o=n[e>>>2]>>>24-e%4*8&255;i.push((o>>>4).toString(16)),i.push((15&o).toString(16))}return i.join("")},parse:function(t){for(var n=t.length,r=[],i=0;i<n;i+=2)r[i>>>3]|=parseInt(t.substr(i,2),16)<<24-i%8*4;return new a.init(r,n/2)}},h=c.Latin1={stringify:function(t){for(var n=t.words,r=t.sigBytes,i=[],e=0;e<r;e++){var o=n[e>>>2]>>>24-e%4*8&255;i.push(String.fromCharCode(o))}return i.join("")},parse:function(t){for(var n=t.length,r=[],i=0;i<n;i++)r[i>>>2]|=(255&t.charCodeAt(i))<<24-i%4*8;return new a.init(r,n)}},f=c.Utf8={stringify:function(t){try{return decodeURIComponent(escape(h.stringify(t)))}catch(t){throw new Error("Malformed UTF-8 data")}},parse:function(t){return h.parse(unescape(encodeURIComponent(t)))}},l=o.BufferedBlockAlgorithm=s.extend({reset:function(){this._data=new a.init,this._nDataBytes=0},_append:function(t){"string"==typeof t&&(t=f.parse(t)),this._data.concat(t),this._nDataBytes+=t.sigBytes},_process:function(n){var r,i=this._data,e=i.words,o=i.sigBytes,s=this.blockSize,c=o/(4*s),u=(c=n?t.ceil(c):t.max((0|c)-this._minBufferSize,0))*s,h=t.min(4*u,o);if(u){for(var f=0;f<u;f+=s)this._doProcessBlock(e,f);r=e.splice(0,u),i.sigBytes-=h}return new a.init(r,h)},clone:function(){var t=s.clone.call(this);return t._data=this._data.clone(),t},_minBufferSize:0}),p=(o.Hasher=l.extend({cfg:s.extend(),init:function(t){this.cfg=this.cfg.extend(t),this.reset()},reset:function(){l.reset.call(this),this._doReset()},update:function(t){return this._append(t),this._process(),this},finalize:function(t){return t&&this._append(t),this._doFinalize()},blockSize:16,_createHelper:function(t){return function(n,r){return new t.init(r).finalize(n)}},_createHmacHelper:function(t){return function(n,r){return new p.HMAC.init(t,r).finalize(n)}}}),e.algo={});return e}(Math);!function(){var t=CryptoJS,n=t.lib,r=n.WordArray,i=n.Hasher,e=t.algo,o=[],s=e.SHA1=i.extend({_doReset:function(){this._hash=new r.init([1732584193,4023233417,2562383102,271733878,3285377520])},_doProcessBlock:function(t,n){for(var r=this._hash.words,i=r[0],e=r[1],s=r[2],a=r[3],c=r[4],u=0;u<80;u++){if(u<16)o[u]=0|t[n+u];else{var h=o[u-3]^o[u-8]^o[u-14]^o[u-16];o[u]=h<<1|h>>>31}var f=(i<<5|i>>>27)+c+o[u];f+=u<20?1518500249+(e&s|~e&a):u<40?1859775393+(e^s^a):u<60?(e&s|e&a|s&a)-1894007588:(e^s^a)-899497514,c=a,a=s,s=e<<30|e>>>2,e=i,i=f}r[0]=r[0]+i|0,r[1]=r[1]+e|0,r[2]=r[2]+s|0,r[3]=r[3]+a|0,r[4]=r[4]+c|0},_doFinalize:function(){var t=this._data,n=t.words,r=8*this._nDataBytes,i=8*t.sigBytes;return n[i>>>5]|=128<<24-i%32,n[14+(i+64>>>9<<4)]=Math.floor(r/4294967296),n[15+(i+64>>>9<<4)]=r,t.sigBytes=4*n.length,this._process(),this._hash},clone:function(){var t=i.clone.call(this);return t._hash=this._hash.clone(),t}});t.SHA1=i._createHelper(s),t.HmacSHA1=i._createHmacHelper(s)}();}


//转换为小写
function ObjectKeys2LowerCase(obj){return Object.fromEntries(Object.entries(obj).map(([k,v])=>[k.toLowerCase(),v]))};

// 获取环境变量
function getEnv(...keys){for(let key of keys){var value=$.isNode()?process.env[key]||process.env[key.toUpperCase()]||process.env[key.toLowerCase()]||$.getdata(key):$.getdata(key);if(value)return value;}};

/**
 * 请求函数二次封装
 * @param {(object|string)} options - 构造请求内容，可传入对象或 Url
 * @returns {(object|string)} - 根据 options['respType'] 传入的 {status|headers|rawBody} 返回对象或字符串，默认为 body
 */
async function Request(options) {
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
                    debug(response, '[response]');
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

// 发送消息
async function sendMsg(message){if(!message)return;try{if($.isNode()){try{var notify=require('./sendNotify');}catch(e){var notify=require('./utils/sendNotify');}await notify.sendNotify($.name,message);}else{$.msg($.name,'',message);}}catch(e){$.log(`\n\n-----${$.name}-----\n${message}`);}};

// DEBUG
function debug(content,title="debug"){let start=`\n-----${title}-----\n`;let end=`\n-----${$.time('HH:mm:ss')}-----\n`;if($.is_debug==='true'){if(typeof content=="string"){$.log(start+content+end);}else if(typeof content=="object"){$.log(start+$.toStr(content)+end);}}};

// Env
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,a)=>{s.call(this,t,(t,s,r)=>{t?a(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.encoding="utf-8",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}getEnv(){return"undefined"!=typeof $environment&&$environment["surge-version"]?"Surge":"undefined"!=typeof $environment&&$environment["stash-version"]?"Stash":"undefined"!=typeof module&&module.exports?"Node.js":"undefined"!=typeof $task?"Quantumult X":"undefined"!=typeof $loon?"Loon":"undefined"!=typeof $rocket?"Shadowrocket":void 0}isNode(){return"Node.js"===this.getEnv()}isQuanX(){return"Quantumult X"===this.getEnv()}isSurge(){return"Surge"===this.getEnv()}isLoon(){return"Loon"===this.getEnv()}isShadowrocket(){return"Shadowrocket"===this.getEnv()}isStash(){return"Stash"===this.getEnv()}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const a=this.getdata(t);if(a)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,a)=>e(a))})}runScript(t,e){return new Promise(s=>{let a=this.getdata("@chavy_boxjs_userCfgs.httpapi");a=a?a.replace(/\n/g,"").trim():a;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[i,o]=a.split("@"),n={url:`http://${o}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":i,Accept:"*/*"},timeout:r};this.post(n,(t,e,a)=>s(a))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),a=!s&&this.fs.existsSync(e);if(!s&&!a)return{};{const a=s?t:e;try{return JSON.parse(this.fs.readFileSync(a))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),a=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):a?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const a=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of a)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,a)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[a+1])>>0==+e[a+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,a]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,a,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,a,r]=/^@(.*?)\.(.*?)$/.exec(e),i=this.getval(a),o=a?"null"===i?null:i||"{}":"{}";try{const e=JSON.parse(o);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),a)}catch(e){const i={};this.lodash_set(i,r,t),s=this.setval(JSON.stringify(i),a)}}else s=this.setval(t,e);return s}getval(t){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.read(t);case"Quantumult X":return $prefs.valueForKey(t);case"Node.js":return this.data=this.loaddata(),this.data[t];default:return this.data&&this.data[t]||null}}setval(t,e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.write(t,e);case"Quantumult X":return $prefs.setValueForKey(t,e);case"Node.js":return this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0;default:return this.data&&this.data[e]||null}}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){switch(t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"],delete t.headers["content-type"],delete t.headers["content-length"]),t.params&&(t.url+="?"+this.queryStr(t.params)),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,a)=>{!t&&s&&(s.body=a,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,a)});break;case"Quantumult X":this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:a,headers:r,body:i,bodyBytes:o}=t;e(null,{status:s,statusCode:a,headers:r,body:i,bodyBytes:o},i,o)},t=>e(t&&t.error||"UndefinedError"));break;case"Node.js":let s=require("iconv-lite");this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:a,statusCode:r,headers:i,rawBody:o}=t,n=s.decode(o,this.encoding);e(null,{status:a,statusCode:r,headers:i,rawBody:o,body:n},n)},t=>{const{message:a,response:r}=t;e(a,r,r&&s.decode(r.rawBody,this.encoding))})}}post(t,e=(()=>{})){const s=t.method?t.method.toLocaleLowerCase():"post";switch(t.body&&t.headers&&!t.headers["Content-Type"]&&!t.headers["content-type"]&&(t.headers["content-type"]="application/x-www-form-urlencoded"),t.headers&&(delete t.headers["Content-Length"],delete t.headers["content-length"]),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient[s](t,(t,s,a)=>{!t&&s&&(s.body=a,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,a)});break;case"Quantumult X":t.method=s,this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:a,headers:r,body:i,bodyBytes:o}=t;e(null,{status:s,statusCode:a,headers:r,body:i,bodyBytes:o},i,o)},t=>e(t&&t.error||"UndefinedError"));break;case"Node.js":let a=require("iconv-lite");this.initGotEnv(t);const{url:r,...i}=t;this.got[s](r,i).then(t=>{const{statusCode:s,statusCode:r,headers:i,rawBody:o}=t,n=a.decode(o,this.encoding);e(null,{status:s,statusCode:r,headers:i,rawBody:o,body:n},n)},t=>{const{message:s,response:r}=t;e(s,r,r&&a.decode(r.rawBody,this.encoding))})}}time(t,e=null){const s=e?new Date(e):new Date;let a={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in a)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?a[e]:("00"+a[e]).substr((""+a[e]).length)));return t}queryStr(t){let e="";for(const s in t){let a=t[s];null!=a&&""!==a&&("object"==typeof a&&(a=JSON.stringify(a)),e+=`${s}=${a}&`)}return e=e.substring(0,e.length-1),e}msg(e=t,s="",a="",r){const i=t=>{switch(typeof t){case void 0:return t;case"string":switch(this.getEnv()){case"Surge":case"Stash":default:return{url:t};case"Loon":case"Shadowrocket":return t;case"Quantumult X":return{"open-url":t};case"Node.js":return}case"object":switch(this.getEnv()){case"Surge":case"Stash":case"Shadowrocket":default:{let e=t.url||t.openUrl||t["open-url"];return{url:e}}case"Loon":{let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}case"Quantumult X":{let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl,a=t["update-pasteboard"]||t.updatePasteboard;return{"open-url":e,"media-url":s,"update-pasteboard":a}}case"Node.js":return}default:return}};if(!this.isMute)switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:$notification.post(e,s,a,i(r));break;case"Quantumult X":$notify(e,s,a,i(r));break;case"Node.js":}if(!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),a&&t.push(a),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:this.log("",`❗️${this.name}, 错误!`,t);break;case"Node.js":this.log("",`❗️${this.name}, 错误!`,t.stack)}}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;switch(this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:$done(t);break;case"Node.js":process.exit(1)}}}(t,e)}