/*
# slidebox
====================================
[mitm]
hostname = asia-east2-slidebox-ios-prod.cloudfunctions.net

[rewrite_local]
^https:\/\/asia-east2-slidebox-ios-prod\.cloudfunctions\.net\/api_v1$ url script-response-body https://raw.githubusercontent.com/wf021325/qx/master/js/slidebox.js
====================================
*/

var body = '{"data":{"env":{"projectId":"slidebox-ios-prod","region":"us-central1","function":"api_v1","realm":"prod"},"appStoreRecord":{"purchases":[{"productId":"co.slidebox.iap.apple.fullversion"}],"subscriptions":[],"validatedTimestampMs":"1616836532860","bundleId":"co.slidebox.Slidebox"}}}';
$done({body});
