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

var CryptoJS=CryptoJS||function(t,n){var r;if("undefined"!=typeof window&&window.crypto&&(r=window.crypto),"undefined"!=typeof self&&self.crypto&&(r=self.crypto),"undefined"!=typeof globalThis&&globalThis.crypto&&(r=globalThis.crypto),!r&&"undefined"!=typeof window&&window.msCrypto&&(r=window.msCrypto),!r&&"undefined"!=typeof global&&global.crypto&&(r=global.crypto),!r&&"function"==typeof require)try{r=require("crypto")}catch(t){}var e=function(){if(r){if("function"==typeof r.getRandomValues)try{return r.getRandomValues(new Uint32Array(1))[0]}catch(t){}if("function"==typeof r.randomBytes)try{return r.randomBytes(4).readInt32LE()}catch(t){}}throw new Error("Native crypto module could not be used to get secure random number.")},i=Object.create||function(){function t(){}return function(n){var r;return t.prototype=n,r=new t,t.prototype=null,r}}(),o={},s=o.lib={},a=s.Base={extend:function(t){var n=i(this);return t&&n.mixIn(t),n.hasOwnProperty("init")&&this.init!==n.init||(n.init=function(){n.$super.init.apply(this,arguments)}),n.init.prototype=n,n.$super=this,n},create:function(){var t=this.extend();return t.init.apply(t,arguments),t},init:function(){},mixIn:function(t){for(var n in t)t.hasOwnProperty(n)&&(this[n]=t[n]);t.hasOwnProperty("toString")&&(this.toString=t.toString)},clone:function(){return this.init.prototype.extend(this)}},c=s.WordArray=a.extend({init:function(t,n){t=this.words=t||[],this.sigBytes=null!=n?n:4*t.length},toString:function(t){return(t||f).stringify(this)},concat:function(t){var n=this.words,r=t.words,e=this.sigBytes,i=t.sigBytes;if(this.clamp(),e%4)for(var o=0;o<i;o++){var s=r[o>>>2]>>>24-o%4*8&255;n[e+o>>>2]|=s<<24-(e+o)%4*8}else for(var a=0;a<i;a+=4)n[e+a>>>2]=r[a>>>2];return this.sigBytes+=i,this},clamp:function(){var n=this.words,r=this.sigBytes;n[r>>>2]&=4294967295<<32-r%4*8,n.length=t.ceil(r/4)},clone:function(){var t=a.clone.call(this);return t.words=this.words.slice(0),t},random:function(n){var r,i=[],o=function(n){n=n;var r=987654321,e=4294967295;return function(){var i=((r=36969*(65535&r)+(r>>16)&e)<<16)+(n=18e3*(65535&n)+(n>>16)&e)&e;return i/=4294967296,(i+=.5)*(t.random()>.5?1:-1)}},s=!1;try{e(),s=!0}catch(t){}for(var a,u=0;u<n;u+=4)s?i.push(e()):(a=987654071*(r=o(4294967296*(a||t.random())))(),i.push(4294967296*r()|0));return new c.init(i,n)}}),u=o.enc={},f=u.Hex={stringify:function(t){for(var n=t.words,r=t.sigBytes,e=[],i=0;i<r;i++){var o=n[i>>>2]>>>24-i%4*8&255;e.push((o>>>4).toString(16)),e.push((15&o).toString(16))}return e.join("")},parse:function(t){for(var n=t.length,r=[],e=0;e<n;e+=2)r[e>>>3]|=parseInt(t.substr(e,2),16)<<24-e%8*4;return new c.init(r,n/2)}},h=u.Latin1={stringify:function(t){for(var n=t.words,r=t.sigBytes,e=[],i=0;i<r;i++){var o=n[i>>>2]>>>24-i%4*8&255;e.push(String.fromCharCode(o))}return e.join("")},parse:function(t){for(var n=t.length,r=[],e=0;e<n;e++)r[e>>>2]|=(255&t.charCodeAt(e))<<24-e%4*8;return new c.init(r,n)}},d=u.Utf8={stringify:function(t){try{return decodeURIComponent(escape(h.stringify(t)))}catch(t){throw new Error("Malformed UTF-8 data")}},parse:function(t){return h.parse(unescape(encodeURIComponent(t)))}},l=s.BufferedBlockAlgorithm=a.extend({reset:function(){this._data=new c.init,this._nDataBytes=0},_append:function(t){"string"==typeof t&&(t=d.parse(t)),this._data.concat(t),this._nDataBytes+=t.sigBytes},_process:function(n){var r,e=this._data,i=e.words,o=e.sigBytes,s=this.blockSize,a=o/(4*s),u=(a=n?t.ceil(a):t.max((0|a)-this._minBufferSize,0))*s,f=t.min(4*u,o);if(u){for(var h=0;h<u;h+=s)this._doProcessBlock(i,h);r=i.splice(0,u),e.sigBytes-=f}return new c.init(r,f)},clone:function(){var t=a.clone.call(this);return t._data=this._data.clone(),t},_minBufferSize:0}),p=(s.Hasher=l.extend({cfg:a.extend(),init:function(t){this.cfg=this.cfg.extend(t),this.reset()},reset:function(){l.reset.call(this),this._doReset()},update:function(t){return this._append(t),this._process(),this},finalize:function(t){return t&&this._append(t),this._doFinalize()},blockSize:16,_createHelper:function(t){return function(n,r){return new t.init(r).finalize(n)}},_createHmacHelper:function(t){return function(n,r){return new p.HMAC.init(t,r).finalize(n)}}}),o.algo={});return o}(Math);function MD5_Encrypt(t){return CryptoJS.MD5(t).toString()}!function(t){var n=CryptoJS,r=n.lib,e=r.WordArray,i=r.Hasher,o=n.algo,s=[];!function(){for(var n=0;n<64;n++)s[n]=4294967296*t.abs(t.sin(n+1))|0}();var a=o.MD5=i.extend({_doReset:function(){this._hash=new e.init([1732584193,4023233417,2562383102,271733878])},_doProcessBlock:function(t,n){for(var r=0;r<16;r++){var e=n+r,i=t[e];t[e]=16711935&(i<<8|i>>>24)|4278255360&(i<<24|i>>>8)}var o=this._hash.words,a=t[n+0],d=t[n+1],l=t[n+2],p=t[n+3],y=t[n+4],g=t[n+5],v=t[n+6],w=t[n+7],_=t[n+8],m=t[n+9],B=t[n+10],S=t[n+11],b=t[n+12],x=t[n+13],C=t[n+14],H=t[n+15],z=o[0],M=o[1],D=o[2],A=o[3];M=h(M=h(M=h(M=h(M=f(M=f(M=f(M=f(M=u(M=u(M=u(M=u(M=c(M=c(M=c(M=c(M,D=c(D,A=c(A,z=c(z,M,D,A,a,7,s[0]),M,D,d,12,s[1]),z,M,l,17,s[2]),A,z,p,22,s[3]),D=c(D,A=c(A,z=c(z,M,D,A,y,7,s[4]),M,D,g,12,s[5]),z,M,v,17,s[6]),A,z,w,22,s[7]),D=c(D,A=c(A,z=c(z,M,D,A,_,7,s[8]),M,D,m,12,s[9]),z,M,B,17,s[10]),A,z,S,22,s[11]),D=c(D,A=c(A,z=c(z,M,D,A,b,7,s[12]),M,D,x,12,s[13]),z,M,C,17,s[14]),A,z,H,22,s[15]),D=u(D,A=u(A,z=u(z,M,D,A,d,5,s[16]),M,D,v,9,s[17]),z,M,S,14,s[18]),A,z,a,20,s[19]),D=u(D,A=u(A,z=u(z,M,D,A,g,5,s[20]),M,D,B,9,s[21]),z,M,H,14,s[22]),A,z,y,20,s[23]),D=u(D,A=u(A,z=u(z,M,D,A,m,5,s[24]),M,D,C,9,s[25]),z,M,p,14,s[26]),A,z,_,20,s[27]),D=u(D,A=u(A,z=u(z,M,D,A,x,5,s[28]),M,D,l,9,s[29]),z,M,w,14,s[30]),A,z,b,20,s[31]),D=f(D,A=f(A,z=f(z,M,D,A,g,4,s[32]),M,D,_,11,s[33]),z,M,S,16,s[34]),A,z,C,23,s[35]),D=f(D,A=f(A,z=f(z,M,D,A,d,4,s[36]),M,D,y,11,s[37]),z,M,w,16,s[38]),A,z,B,23,s[39]),D=f(D,A=f(A,z=f(z,M,D,A,x,4,s[40]),M,D,a,11,s[41]),z,M,p,16,s[42]),A,z,v,23,s[43]),D=f(D,A=f(A,z=f(z,M,D,A,m,4,s[44]),M,D,b,11,s[45]),z,M,H,16,s[46]),A,z,l,23,s[47]),D=h(D,A=h(A,z=h(z,M,D,A,a,6,s[48]),M,D,w,10,s[49]),z,M,C,15,s[50]),A,z,g,21,s[51]),D=h(D,A=h(A,z=h(z,M,D,A,b,6,s[52]),M,D,p,10,s[53]),z,M,B,15,s[54]),A,z,d,21,s[55]),D=h(D,A=h(A,z=h(z,M,D,A,_,6,s[56]),M,D,H,10,s[57]),z,M,v,15,s[58]),A,z,x,21,s[59]),D=h(D,A=h(A,z=h(z,M,D,A,y,6,s[60]),M,D,S,10,s[61]),z,M,l,15,s[62]),A,z,m,21,s[63]),o[0]=o[0]+z|0,o[1]=o[1]+M|0,o[2]=o[2]+D|0,o[3]=o[3]+A|0},_doFinalize:function(){var n=this._data,r=n.words,e=8*this._nDataBytes,i=8*n.sigBytes;r[i>>>5]|=128<<24-i%32;var o=t.floor(e/4294967296),s=e;r[15+(i+64>>>9<<4)]=16711935&(o<<8|o>>>24)|4278255360&(o<<24|o>>>8),r[14+(i+64>>>9<<4)]=16711935&(s<<8|s>>>24)|4278255360&(s<<24|s>>>8),n.sigBytes=4*(r.length+1),this._process();for(var a=this._hash,c=a.words,u=0;u<4;u++){var f=c[u];c[u]=16711935&(f<<8|f>>>24)|4278255360&(f<<24|f>>>8)}return a},clone:function(){var t=i.clone.call(this);return t._hash=this._hash.clone(),t}});function c(t,n,r,e,i,o,s){var a=t+(n&r|~n&e)+i+s;return(a<<o|a>>>32-o)+n}function u(t,n,r,e,i,o,s){var a=t+(n&e|r&~e)+i+s;return(a<<o|a>>>32-o)+n}function f(t,n,r,e,i,o,s){var a=t+(n^r^e)+i+s;return(a<<o|a>>>32-o)+n}function h(t,n,r,e,i,o,s){var a=t+(r^(n|~e))+i+s;return(a<<o|a>>>32-o)+n}n.MD5=i._createHelper(a),n.HmacMD5=i._createHmacHelper(a)}(Math);


const $ = new Env("小豆苗APP");
const _key = 'XDM_Header';
let Token = $.getdata(_key);
var message = "";

!(async() => {
    if (typeof $request != "undefined") {
        getToken();
        return;
    }
    await checkToken()
    if(isLogin == 2){
        await updataToken();
        Token = $.getdata(_key);
    }
    await signin();
    签到结果 && (await submit())
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
    return CryptoJS.MD5(a).toString()
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
                //console.log('签到11111：'+data);
                if (obj?.code == '00000') {
                    message += `签到1:签到成功\n`;
                    签到结果 = true
                } else if (obj?.code == '006') {
                    message += `签到1:${obj?.errorMsg}\n`;
                    签到结果 = false
                } else {
                    message+=`❌签到失败1:${obj?.errorMsg}!\n`
                    签到结果 = false
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
        let a =`{"missionCodeList":["uTAwwT","tRa4XC"],"timestamp":${new Date().getTime()},"url":"https:\\/\\/dm.yeemiao.com\\/point\\/signin\\/v2","token":"${Token}","extra":"{\\"token\\":\\"${Token}\\"}"}`
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
                //console.log('签到22222：'+data);
                if (obj?.code == '00000') {
                    message += `签到2:${obj?.data?.toastText}\n`;
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
                $.msg($.name, "", "❌${obj?.errorMsg}");
            }
            resolve();
        });
    });
}

async function notify() {$.msg($.name, "", message);}

//*****************************
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,a)=>{s.call(this,t,(t,s,r)=>{t?a(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.encoding="utf-8",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}getEnv(){return"undefined"!=typeof $environment&&$environment["surge-version"]?"Surge":"undefined"!=typeof $environment&&$environment["stash-version"]?"Stash":"undefined"!=typeof module&&module.exports?"Node.js":"undefined"!=typeof $task?"Quantumult X":"undefined"!=typeof $loon?"Loon":"undefined"!=typeof $rocket?"Shadowrocket":void 0}isNode(){return"Node.js"===this.getEnv()}isQuanX(){return"Quantumult X"===this.getEnv()}isSurge(){return"Surge"===this.getEnv()}isLoon(){return"Loon"===this.getEnv()}isShadowrocket(){return"Shadowrocket"===this.getEnv()}isStash(){return"Stash"===this.getEnv()}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const a=this.getdata(t);if(a)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,a)=>e(a))})}runScript(t,e){return new Promise(s=>{let a=this.getdata("@chavy_boxjs_userCfgs.httpapi");a=a?a.replace(/\n/g,"").trim():a;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[i,o]=a.split("@"),n={url:`http://${o}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":i,Accept:"*/*"},timeout:r};this.post(n,(t,e,a)=>s(a))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),a=!s&&this.fs.existsSync(e);if(!s&&!a)return{};{const a=s?t:e;try{return JSON.parse(this.fs.readFileSync(a))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),a=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):a?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const a=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of a)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,a)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[a+1])>>0==+e[a+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,a]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,a,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,a,r]=/^@(.*?)\.(.*?)$/.exec(e),i=this.getval(a),o=a?"null"===i?null:i||"{}":"{}";try{const e=JSON.parse(o);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),a)}catch(e){const i={};this.lodash_set(i,r,t),s=this.setval(JSON.stringify(i),a)}}else s=this.setval(t,e);return s}getval(t){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.read(t);case"Quantumult X":return $prefs.valueForKey(t);case"Node.js":return this.data=this.loaddata(),this.data[t];default:return this.data&&this.data[t]||null}}setval(t,e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.write(t,e);case"Quantumult X":return $prefs.setValueForKey(t,e);case"Node.js":return this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0;default:return this.data&&this.data[e]||null}}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){switch(t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"],delete t.headers["content-type"],delete t.headers["content-length"]),t.params&&(t.url+="?"+this.queryStr(t.params)),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,a)=>{!t&&s&&(s.body=a,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,a)});break;case"Quantumult X":this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:a,headers:r,body:i,bodyBytes:o}=t;e(null,{status:s,statusCode:a,headers:r,body:i,bodyBytes:o},i,o)},t=>e(t&&t.error||"UndefinedError"));break;case"Node.js":let s=require("iconv-lite");this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:a,statusCode:r,headers:i,rawBody:o}=t,n=s.decode(o,this.encoding);e(null,{status:a,statusCode:r,headers:i,rawBody:o,body:n},n)},t=>{const{message:a,response:r}=t;e(a,r,r&&s.decode(r.rawBody,this.encoding))})}}post(t,e=(()=>{})){const s=t.method?t.method.toLocaleLowerCase():"post";switch(t.body&&t.headers&&!t.headers["Content-Type"]&&!t.headers["content-type"]&&(t.headers["content-type"]="application/x-www-form-urlencoded"),t.headers&&(delete t.headers["Content-Length"],delete t.headers["content-length"]),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient[s](t,(t,s,a)=>{!t&&s&&(s.body=a,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,a)});break;case"Quantumult X":t.method=s,this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:a,headers:r,body:i,bodyBytes:o}=t;e(null,{status:s,statusCode:a,headers:r,body:i,bodyBytes:o},i,o)},t=>e(t&&t.error||"UndefinedError"));break;case"Node.js":let a=require("iconv-lite");this.initGotEnv(t);const{url:r,...i}=t;this.got[s](r,i).then(t=>{const{statusCode:s,statusCode:r,headers:i,rawBody:o}=t,n=a.decode(o,this.encoding);e(null,{status:s,statusCode:r,headers:i,rawBody:o,body:n},n)},t=>{const{message:s,response:r}=t;e(s,r,r&&a.decode(r.rawBody,this.encoding))})}}time(t,e=null){const s=e?new Date(e):new Date;let a={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in a)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?a[e]:("00"+a[e]).substr((""+a[e]).length)));return t}queryStr(t){let e="";for(const s in t){let a=t[s];null!=a&&""!==a&&("object"==typeof a&&(a=JSON.stringify(a)),e+=`${s}=${a}&`)}return e=e.substring(0,e.length-1),e}msg(e=t,s="",a="",r){const i=t=>{switch(typeof t){case void 0:return t;case"string":switch(this.getEnv()){case"Surge":case"Stash":default:return{url:t};case"Loon":case"Shadowrocket":return t;case"Quantumult X":return{"open-url":t};case"Node.js":return}case"object":switch(this.getEnv()){case"Surge":case"Stash":case"Shadowrocket":default:{let e=t.url||t.openUrl||t["open-url"];return{url:e}}case"Loon":{let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}case"Quantumult X":{let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl,a=t["update-pasteboard"]||t.updatePasteboard;return{"open-url":e,"media-url":s,"update-pasteboard":a}}case"Node.js":return}default:return}};if(!this.isMute)switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:$notification.post(e,s,a,i(r));break;case"Quantumult X":$notify(e,s,a,i(r));break;case"Node.js":}if(!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),a&&t.push(a),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:this.log("",`❗️${this.name}, 错误!`,t);break;case"Node.js":this.log("",`❗️${this.name}, 错误!`,t.stack)}}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;switch(this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:$done(t);break;case"Node.js":process.exit(1)}}}(t,e)}
