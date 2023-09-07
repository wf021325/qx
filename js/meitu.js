/*
美图秀秀

[rewrite_local]
^https?:\/\/(h5|api)\.xiuxiu\.meitu\.com\/v\d\/(h\d\/vip|vip|user)\/ url script-response-body https://raw.githubusercontent.com/wf021325/qx/master/js/meitu.js

[mitm]
hostname = *.xiuxiu.meitu.com
 */

url = $request.url
	body = $response.body
	if (url.indexOf('vip/vip_show') != -1) {
		var obj = JSON.parse(body);
		obj.data.show_producer_level = 2;
		obj.data.s = 1;
		obj.data.vip_type = 3;
		obj.data.is_valid_user = 1;
		obj.data.is_expire = 0;
		obj.data.valid_time = 4641350722;
		obj.data.vip_icon = 'https://xximg1.meitudata.com/6948531818264286440.png';
		body = JSON.stringify(obj);
	}
	$done({body)});
