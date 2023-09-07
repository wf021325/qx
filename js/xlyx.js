/* 

小蓝医学，解锁VIP 仅QX测试
软件下载链接：https://apps.apple.com/cn/app/id1642455052


密钥来源频道：https://t.me/chxm1023
密钥来源链接：https://t.me/chxm1023/318
====================================
[rewrite_local]
^https:\/\/edu\.lezaitizhong\.com\/(vod|tiku)\/(class_list|getclassifychapter)\? url script-response-body https://raw.githubusercontent.com/wf021325/qx/master/js/xlyx.js

[mitm]
hostname = edu.lezaitizhong.com
====================================

 */

let body = $response.body;
body = body.replace(/\"is_unlock\"\:\"0\"/g,'"is_unlock":"1"');
$done({body});

