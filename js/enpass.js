/*

[rewrite_local]
^https?:\/\/license\.enpass\.io\/api\/v1\/subscription\/me  url script-response-body https://raw.githubusercontent.com/wf021325/qx/master/js/enpass.js

[mitm]
hostname = license.enpass.io
*/

var obj = JSON.parse($response.body);

obj.license = "premium";
obj.info = {
  purchase_type: "inapp",
  store: "ios",
  id: "ENP_IAP_LTP",
  userid: "000000",
  transaction_id: "1000000000000000",
  logo: ""
};

$done({ body: JSON.stringify(obj) });