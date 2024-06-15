/*
沃尔沃汽车签到
仅QX，nodejs测试，其他自测
2024-06-15
获取Token方法 :
    长时间不进入APP，有机会触发获取到Token,这个不是脚本问题。
    或者退出重新登录，立马可以获取到Token

======调试区|忽略======
# ^https:\/\/apigateway\.digitalvolvo\.com\/app/iam\/api\/v\d\/(auth$|refreshToken=) url script-response-body http://192.168.2.170:8080/volvo.js
======调试区|忽略======

====================================
[rewrite_local]
^https:\/\/apigateway\.digitalvolvo\.com\/app/iam\/api\/v\d\/(auth$|refreshToken=) url script-response-body https://raw.githubusercontent.com/wf021325/qx/master/task/volvo.js

[task_local]
1 0 * * * https://raw.githubusercontent.com/wf021325/qx/master/task/volvo.js, tag= 沃尔沃汽车签到, enabled=true

[mitm]
hostname = apigateway.digitalvolvo.com
====================================

# 青龙环境变量  volvo_val = '{"refreshToken":"xxxxxxxxxxxxx"}'
# 登录        https://apigateway.digitalvolvo.com/app/iam/api/v1/auth
# 更新token   https://apigateway.digitalvolvo.com/app/iam/api/v1/refreshToken?refreshToken=xxxxxxx
登录链接refreshToken=xxxxxxx 的xxxx    或者在他们的$response.body里面找到data.refreshToken，就是refreshToken
 */

const $ = new Env("沃尔沃");
const _key = 'volvo_val';
var CK_Val = $.getdata(_key) || ($.isNode() ? process.env[_key] : '');
var message = '', isOk = false;

!(async () => {
    if (typeof $request !== "undefined") {
        getCk();
        return;
    }
    if (!CK_Val) return $.msg($.name, '', '❌请先获取Token🎉');
    await main();
})().catch((e) => {
    $.log("", `❌失败! 原因: ${e}!`, "");
}).finally(() => {
    $.done();
});

function getCk() {
    if ($request && $request.method != 'OPTIONS') {
        const refreshToken = $.toObj($response.body)?.data?.refreshToken;
        if (refreshToken) {
            const ckVal = $.toStr({refreshToken});
            $.setdata(ckVal, _key);
            $.msg($.name, '获取Token成功🎉', ckVal);
        } else {
            $.msg($.name, '', '❌获取Token失败');
        }
    }
}

async function main() {
    $.key = 'bjGqb3TvEEZ8W8QhoyhEH4IenwCnc4JQ';
    intCryptoJS(), intSha256(), intHmacsha256();
    $.appversion = $.toObj((await $.http.get(`https://itunes.apple.com/cn/lookup?id=1587570076`))?.body)?.results[0]?.version;
    //$.log(`最新版本号：${$.appversion}`)
    await getToken();
    isOk && (await getsignIn())
    console.log(message); //node,青龙日志
    await SendMsg(message);
}

async function getToken() {
    return new Promise((resolve) => {
        token = $.toObj(CK_Val).refreshToken;
        signTime = get_Time();
        url = `https://apigateway.digitalvolvo.com/app/iam/api/v1/refreshToken?refreshToken=${token}`;
        signature = CryptoJS.HmacSHA256(`SDK-HMAC-SHA256\n${signTime}\n${CryptoJS.SHA256(`GET\n/app/iam/api/v1/refreshToken/\nrefreshToken=${token}\nhost:apigateway.digitalvolvo.com\nx-sdk-content-sha256:UNSIGNED-PAYLOAD\nx-sdk-date:${signTime}\n\nhost;x-sdk-content-sha256;x-sdk-date\nUNSIGNED-PAYLOAD`).toString()}`, $.key).toString();
        headers = gethead(signTime, 'host;x-sdk-content-sha256;x-sdk-date', signature);
        $.get({url, headers}, (error, response, data) => {
            try {
                //$.log(data)
                const obj = $.toObj(data);
                if (obj?.code == 200) {
                    $.memberId = obj?.data?.memberId;
                    $.accessToken = obj?.data?.accessToken;
                    $.jwtToken = obj?.data?.jwtToken;
                    //$.log($.accessToken)
                    message += `获取签到信息:${$.memberId}\n`;
                    return isOk = true
                } else if (obj?.code == 401) {
                    message += `获取签到信息:Token失效，请重新获取\n`;
                } else {
                    message += `获取签到信息:${obj?.error_msg}\n`;////error_msg--errMsg
                }
            } catch (e) {
                $.logErr(e, "❌请重新登陆更新Token");
            } finally {
                resolve();
            }
        });
    });
}

async function getsignIn() {
    return new Promise((resolve) => {
        signTime = get_Time();
        url = `https://apigateway.digitalvolvo.com/app/sign/api/v1/signIn`;
        body = '{}'//`{"memberId":"${$.memberId}"}`
        signature = CryptoJS.HmacSHA256(`SDK-HMAC-SHA256\n${signTime}\n${CryptoJS.SHA256(`POST\n/app/sign/api/v1/signIn/\n\nauthorization:Bearer ${$.accessToken}\nhost:apigateway.digitalvolvo.com\nx-sdk-content-sha256:UNSIGNED-PAYLOAD\nx-sdk-date:${signTime}\nx-token:${$.jwtToken}\n\nauthorization;host;x-sdk-content-sha256;x-sdk-date;x-token\nUNSIGNED-PAYLOAD`).toString()}`, $.key).toString();
        headers = {
            ...gethead(signTime, 'authorization;host;x-sdk-content-sha256;x-sdk-date;x-token', signature),
            "X-Token": $.jwtToken,
            "Authorization": `Bearer ${$.accessToken}`
        }
        const rest = {url, body, headers};
        $.post(rest, (err, resp, data) => {
            try {
                const obj = $.toObj(data);
                if (obj?.code == 200) {
                    const signInCountStr = obj?.data.signInCountStr;
                    //$.log(signInCountStr)
                    message += `签到:${signInCountStr}\n`;
                }
            } catch (e) {
                $.logErr(e, "❌请重新登陆更新Token");
            } finally {
                resolve()
            }
        })
    });
}

function gethead(X_Sdk_Date, SignedHeaders, signature) {
    appversion = $.appversion || '5.39.0';
    return {
        "Host": "apigateway.digitalvolvo.com",
        "User-Agent": "ios.volvo.car",
        "v587sign": `SDK-HMAC-SHA256 Access=204114990, SignedHeaders=${SignedHeaders}, Signature=${signature}`,
        "x-sdk-date": X_Sdk_Date,
        "x-sdk-content-sha256": "UNSIGNED-PAYLOAD",
        "Host": "apigateway.digitalvolvo.com",
        "version": appversion,
        "Content-Type": "application/json; charset=UTF-8"
    }
}

//通知
async function SendMsg(message){$.isNode()?await notify.sendNotify($.name,message):$.msg($.name,"",message);}

//时间转换为20240614T143143Z
function get_Time(t=0){const e=new Date();const pad=(num)=>String(num).padStart(2,'0');return`${e.getUTCFullYear()}${pad(e.getUTCMonth()+1)}${pad(e.getUTCDate())}T${pad(e.getUTCHours()+t)}${pad(e.getUTCMinutes())}${pad(e.getUTCSeconds())}Z`;}

//CryptoJS
function intCryptoJS(){CryptoJS=function(t,n){var e;if("undefined"!=typeof window&&window.crypto&&(e=window.crypto),"undefined"!=typeof self&&self.crypto&&(e=self.crypto),"undefined"!=typeof globalThis&&globalThis.crypto&&(e=globalThis.crypto),!e&&"undefined"!=typeof window&&window.msCrypto&&(e=window.msCrypto),!e&&"undefined"!=typeof global&&global.crypto&&(e=global.crypto),!e&&"function"==typeof require)try{e=require("crypto")}catch(t){}var i=function(){if(e){if("function"==typeof e.getRandomValues)try{return e.getRandomValues(new Uint32Array(1))[0]}catch(t){}if("function"==typeof e.randomBytes)try{return e.randomBytes(4).readInt32LE()}catch(t){}}throw new Error("Native crypto module could not be used to get secure random number.")},r=Object.create||function(){function t(){}return function(n){var e;return t.prototype=n,e=new t,t.prototype=null,e}}(),o={},s=o.lib={},a=s.Base={extend:function(t){var n=r(this);return t&&n.mixIn(t),n.hasOwnProperty("init")&&this.init!==n.init||(n.init=function(){n.$super.init.apply(this,arguments)}),n.init.prototype=n,n.$super=this,n},create:function(){var t=this.extend();return t.init.apply(t,arguments),t},init:function(){},mixIn:function(t){for(var n in t)t.hasOwnProperty(n)&&(this[n]=t[n]);t.hasOwnProperty("toString")&&(this.toString=t.toString)},clone:function(){return this.init.prototype.extend(this)}},c=s.WordArray=a.extend({init:function(t,n){t=this.words=t||[],this.sigBytes=null!=n?n:4*t.length},toString:function(t){return(t||f).stringify(this)},concat:function(t){var n=this.words,e=t.words,i=this.sigBytes,r=t.sigBytes;if(this.clamp(),i%4)for(var o=0;o<r;o++){var s=e[o>>>2]>>>24-o%4*8&255;n[i+o>>>2]|=s<<24-(i+o)%4*8}else for(var a=0;a<r;a+=4)n[i+a>>>2]=e[a>>>2];return this.sigBytes+=r,this},clamp:function(){var n=this.words,e=this.sigBytes;n[e>>>2]&=4294967295<<32-e%4*8,n.length=t.ceil(e/4)},clone:function(){var t=a.clone.call(this);return t.words=this.words.slice(0),t},random:function(n){var e,r=[],o=function(n){n=n;var e=987654321,i=4294967295;return function(){var r=((e=36969*(65535&e)+(e>>16)&i)<<16)+(n=18e3*(65535&n)+(n>>16)&i)&i;return r/=4294967296,(r+=.5)*(t.random()>.5?1:-1)}},s=!1;try{i(),s=!0}catch(t){}for(var a,u=0;u<n;u+=4)s?r.push(i()):(a=987654071*(e=o(4294967296*(a||t.random())))(),r.push(4294967296*e()|0));return new c.init(r,n)}}),u=o.enc={},f=u.Hex={stringify:function(t){for(var n=t.words,e=t.sigBytes,i=[],r=0;r<e;r++){var o=n[r>>>2]>>>24-r%4*8&255;i.push((o>>>4).toString(16)),i.push((15&o).toString(16))}return i.join("")},parse:function(t){for(var n=t.length,e=[],i=0;i<n;i+=2)e[i>>>3]|=parseInt(t.substr(i,2),16)<<24-i%8*4;return new c.init(e,n/2)}},p=u.Latin1={stringify:function(t){for(var n=t.words,e=t.sigBytes,i=[],r=0;r<e;r++){var o=n[r>>>2]>>>24-r%4*8&255;i.push(String.fromCharCode(o))}return i.join("")},parse:function(t){for(var n=t.length,e=[],i=0;i<n;i++)e[i>>>2]|=(255&t.charCodeAt(i))<<24-i%4*8;return new c.init(e,n)}},h=u.Utf8={stringify:function(t){try{return decodeURIComponent(escape(p.stringify(t)))}catch(t){throw new Error("Malformed UTF-8 data")}},parse:function(t){return p.parse(unescape(encodeURIComponent(t)))}},d=s.BufferedBlockAlgorithm=a.extend({reset:function(){this._data=new c.init,this._nDataBytes=0},_append:function(t){"string"==typeof t&&(t=h.parse(t)),this._data.concat(t),this._nDataBytes+=t.sigBytes},_process:function(n){var e,i=this._data,r=i.words,o=i.sigBytes,s=this.blockSize,a=o/(4*s),u=(a=n?t.ceil(a):t.max((0|a)-this._minBufferSize,0))*s,f=t.min(4*u,o);if(u){for(var p=0;p<u;p+=s)this._doProcessBlock(r,p);e=r.splice(0,u),i.sigBytes-=f}return new c.init(e,f)},clone:function(){var t=a.clone.call(this);return t._data=this._data.clone(),t},_minBufferSize:0}),l=(s.Hasher=d.extend({cfg:a.extend(),init:function(t){this.cfg=this.cfg.extend(t),this.reset()},reset:function(){d.reset.call(this),this._doReset()},update:function(t){return this._append(t),this._process(),this},finalize:function(t){return t&&this._append(t),this._doFinalize()},blockSize:16,_createHelper:function(t){return function(n,e){return new t.init(e).finalize(n)}},_createHmacHelper:function(t){return function(n,e){return new l.HMAC.init(t,e).finalize(n)}}}),o.algo={});return o}(Math)};
//HMACSHA256
function intHmacsha256(){var e,t,i;e=CryptoJS,t=e.lib.Base,i=e.enc.Utf8,e.algo.HMAC=t.extend({init:function(e,t){e=this._hasher=new e.init,"string"==typeof t&&(t=i.parse(t));var r=e.blockSize,s=4*r;t.sigBytes>s&&(t=e.finalize(t)),t.clamp();for(var n=this._oKey=t.clone(),a=this._iKey=t.clone(),o=n.words,h=a.words,c=0;c<r;c++)o[c]^=1549556828,h[c]^=909522486;n.sigBytes=a.sigBytes=s,this.reset()},reset:function(){var e=this._hasher;e.reset(),e.update(this._iKey)},update:function(e){return this._hasher.update(e),this},finalize:function(e){var t=this._hasher,i=t.finalize(e);return t.reset(),t.finalize(this._oKey.clone().concat(i))}}),function(e){var t=CryptoJS,i=t.lib,r=i.WordArray,s=i.Hasher,n=t.algo,a=[],o=[];!function(){function t(t){for(var i=e.sqrt(t),r=2;r<=i;r++)if(!(t%r))return!1;return!0}function i(e){return 4294967296*(e-(0|e))|0}for(var r=2,s=0;s<64;)t(r)&&(s<8&&(a[s]=i(e.pow(r,.5))),o[s]=i(e.pow(r,1/3)),s++),r++}();var h=[],c=n.SHA256=s.extend({_doReset:function(){this._hash=new r.init(a.slice(0))},_doProcessBlock:function(e,t){for(var i=this._hash.words,r=i[0],s=i[1],n=i[2],a=i[3],c=i[4],f=i[5],l=i[6],u=i[7],_=0;_<64;_++){if(_<16)h[_]=0|e[t+_];else{var d=h[_-15],v=(d<<25|d>>>7)^(d<<14|d>>>18)^d>>>3,y=h[_-2],p=(y<<15|y>>>17)^(y<<13|y>>>19)^y>>>10;h[_]=v+h[_-7]+p+h[_-16]}var H=r&s^r&n^s&n,g=(r<<30|r>>>2)^(r<<19|r>>>13)^(r<<10|r>>>22),w=u+((c<<26|c>>>6)^(c<<21|c>>>11)^(c<<7|c>>>25))+(c&f^~c&l)+o[_]+h[_];u=l,l=f,f=c,c=a+w|0,a=n,n=s,s=r,r=w+(g+H)|0}i[0]=i[0]+r|0,i[1]=i[1]+s|0,i[2]=i[2]+n|0,i[3]=i[3]+a|0,i[4]=i[4]+c|0,i[5]=i[5]+f|0,i[6]=i[6]+l|0,i[7]=i[7]+u|0},_doFinalize:function(){var t=this._data,i=t.words,r=8*this._nDataBytes,s=8*t.sigBytes;return i[s>>>5]|=128<<24-s%32,i[14+(s+64>>>9<<4)]=e.floor(r/4294967296),i[15+(s+64>>>9<<4)]=r,t.sigBytes=4*i.length,this._process(),this._hash},clone:function(){var e=s.clone.call(this);return e._hash=this._hash.clone(),e}});t.SHA256=s._createHelper(c),t.HmacSHA256=s._createHmacHelper(c)}(Math)};
//Sha256
function intSha256(){!function(r){var t=CryptoJS,n=t.lib,e=n.WordArray,o=n.Hasher,a=t.algo,s=[],i=[];!function(){function t(t){for(var n=r.sqrt(t),e=2;e<=n;e++)if(!(t%e))return!1;return!0}function n(r){return 4294967296*(r-(0|r))|0}for(var e=2,o=0;o<64;)t(e)&&(o<8&&(s[o]=n(r.pow(e,.5))),i[o]=n(r.pow(e,1/3)),o++),e++}();var h=[],c=a.SHA256=o.extend({_doReset:function(){this._hash=new e.init(s.slice(0))},_doProcessBlock:function(r,t){for(var n=this._hash.words,e=n[0],o=n[1],a=n[2],s=n[3],c=n[4],f=n[5],l=n[6],u=n[7],_=0;_<64;_++){if(_<16)h[_]=0|r[t+_];else{var v=h[_-15],d=(v<<25|v>>>7)^(v<<14|v>>>18)^v>>>3,H=h[_-2],p=(H<<15|H>>>17)^(H<<13|H>>>19)^H>>>10;h[_]=d+h[_-7]+p+h[_-16]}var w=e&o^e&a^o&a,y=(e<<30|e>>>2)^(e<<19|e>>>13)^(e<<10|e>>>22),S=u+((c<<26|c>>>6)^(c<<21|c>>>11)^(c<<7|c>>>25))+(c&f^~c&l)+i[_]+h[_];u=l,l=f,f=c,c=s+S|0,s=a,a=o,o=e,e=S+(y+w)|0}n[0]=n[0]+e|0,n[1]=n[1]+o|0,n[2]=n[2]+a|0,n[3]=n[3]+s|0,n[4]=n[4]+c|0,n[5]=n[5]+f|0,n[6]=n[6]+l|0,n[7]=n[7]+u|0},_doFinalize:function(){var t=this._data,n=t.words,e=8*this._nDataBytes,o=8*t.sigBytes;return n[o>>>5]|=128<<24-o%32,n[14+(o+64>>>9<<4)]=r.floor(e/4294967296),n[15+(o+64>>>9<<4)]=e,t.sigBytes=4*n.length,this._process(),this._hash},clone:function(){var r=o.clone.call(this);return r._hash=this._hash.clone(),r}});t.SHA256=o._createHelper(c),t.HmacSHA256=o._createHmacHelper(c)}(Math)};
//Env
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,a)=>{s.call(this,t,(t,s,r)=>{t?a(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.encoding="utf-8",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}getEnv(){return"undefined"!=typeof $environment&&$environment["surge-version"]?"Surge":"undefined"!=typeof $environment&&$environment["stash-version"]?"Stash":"undefined"!=typeof module&&module.exports?"Node.js":"undefined"!=typeof $task?"Quantumult X":"undefined"!=typeof $loon?"Loon":"undefined"!=typeof $rocket?"Shadowrocket":void 0}isNode(){return"Node.js"===this.getEnv()}isQuanX(){return"Quantumult X"===this.getEnv()}isSurge(){return"Surge"===this.getEnv()}isLoon(){return"Loon"===this.getEnv()}isShadowrocket(){return"Shadowrocket"===this.getEnv()}isStash(){return"Stash"===this.getEnv()}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const a=this.getdata(t);if(a)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,a)=>e(a))})}runScript(t,e){return new Promise(s=>{let a=this.getdata("@chavy_boxjs_userCfgs.httpapi");a=a?a.replace(/\n/g,"").trim():a;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[i,o]=a.split("@"),n={url:`http://${o}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":i,Accept:"*/*"},timeout:r};this.post(n,(t,e,a)=>s(a))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),a=!s&&this.fs.existsSync(e);if(!s&&!a)return{};{const a=s?t:e;try{return JSON.parse(this.fs.readFileSync(a))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),a=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):a?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const a=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of a)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,a)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[a+1])>>0==+e[a+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,a]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,a,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,a,r]=/^@(.*?)\.(.*?)$/.exec(e),i=this.getval(a),o=a?"null"===i?null:i||"{}":"{}";try{const e=JSON.parse(o);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),a)}catch(e){const i={};this.lodash_set(i,r,t),s=this.setval(JSON.stringify(i),a)}}else s=this.setval(t,e);return s}getval(t){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.read(t);case"Quantumult X":return $prefs.valueForKey(t);case"Node.js":return this.data=this.loaddata(),this.data[t];default:return this.data&&this.data[t]||null}}setval(t,e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.write(t,e);case"Quantumult X":return $prefs.setValueForKey(t,e);case"Node.js":return this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0;default:return this.data&&this.data[e]||null}}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){switch(t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"],delete t.headers["content-type"],delete t.headers["content-length"]),t.params&&(t.url+="?"+this.queryStr(t.params)),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,a)=>{!t&&s&&(s.body=a,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,a)});break;case"Quantumult X":this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:a,headers:r,body:i,bodyBytes:o}=t;e(null,{status:s,statusCode:a,headers:r,body:i,bodyBytes:o},i,o)},t=>e(t&&t.error||"UndefinedError"));break;case"Node.js":let s=require("iconv-lite");this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:a,statusCode:r,headers:i,rawBody:o}=t,n=s.decode(o,this.encoding);e(null,{status:a,statusCode:r,headers:i,rawBody:o,body:n},n)},t=>{const{message:a,response:r}=t;e(a,r,r&&s.decode(r.rawBody,this.encoding))})}}post(t,e=(()=>{})){const s=t.method?t.method.toLocaleLowerCase():"post";switch(t.body&&t.headers&&!t.headers["Content-Type"]&&!t.headers["content-type"]&&(t.headers["content-type"]="application/x-www-form-urlencoded"),t.headers&&(delete t.headers["Content-Length"],delete t.headers["content-length"]),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient[s](t,(t,s,a)=>{!t&&s&&(s.body=a,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,a)});break;case"Quantumult X":t.method=s,this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:a,headers:r,body:i,bodyBytes:o}=t;e(null,{status:s,statusCode:a,headers:r,body:i,bodyBytes:o},i,o)},t=>e(t&&t.error||"UndefinedError"));break;case"Node.js":let a=require("iconv-lite");this.initGotEnv(t);const{url:r,...i}=t;this.got[s](r,i).then(t=>{const{statusCode:s,statusCode:r,headers:i,rawBody:o}=t,n=a.decode(o,this.encoding);e(null,{status:s,statusCode:r,headers:i,rawBody:o,body:n},n)},t=>{const{message:s,response:r}=t;e(s,r,r&&a.decode(r.rawBody,this.encoding))})}}time(t,e=null){const s=e?new Date(e):new Date;let a={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in a)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?a[e]:("00"+a[e]).substr((""+a[e]).length)));return t}queryStr(t){let e="";for(const s in t){let a=t[s];null!=a&&""!==a&&("object"==typeof a&&(a=JSON.stringify(a)),e+=`${s}=${a}&`)}return e=e.substring(0,e.length-1),e}msg(e=t,s="",a="",r){const i=t=>{switch(typeof t){case void 0:return t;case"string":switch(this.getEnv()){case"Surge":case"Stash":default:return{url:t};case"Loon":case"Shadowrocket":return t;case"Quantumult X":return{"open-url":t};case"Node.js":return}case"object":switch(this.getEnv()){case"Surge":case"Stash":case"Shadowrocket":default:{let e=t.url||t.openUrl||t["open-url"];return{url:e}}case"Loon":{let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}case"Quantumult X":{let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl,a=t["update-pasteboard"]||t.updatePasteboard;return{"open-url":e,"media-url":s,"update-pasteboard":a}}case"Node.js":return}default:return}};if(!this.isMute)switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:$notification.post(e,s,a,i(r));break;case"Quantumult X":$notify(e,s,a,i(r));break;case"Node.js":}if(!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),a&&t.push(a),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:this.log("",`❗️${this.name}, 错误!`,t);break;case"Node.js":this.log("",`❗️${this.name}, 错误!`,t.stack)}}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;switch(this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:$done(t);break;case"Node.js":process.exit(1)}}}(t,e)}