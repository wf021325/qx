/*
七猫小说
# ^https?:\/\/(api-\w+|xiaoshuo)\.wtzw\.com\/api\/v\d\/ url script-response-body http://192.168.2.170:8080/qimao.js
====================================
[rewrite_local]
^https?:\/\/(api-\w+|xiaoshuo)\.wtzw\.com\/api\/v\d\/ url script-response-body https://raw.githubusercontent.com/wf021325/qx/master/js/qimao.js
^https:\/\/api-gw\.wtzw\.com\/welf\/app\/v1\/task\/red-packet$ url reject-dict

[mitm]
hostname = *.wtzw.com
====================================
 */

var body = $response.body;
var url = $request.url;

//https://xiaoshuo.wtzw.com/api/v1/user/get-user-info
if (url.includes('/user/get-user-info')) {
    body = body.replace(/\"is_vip\"\:\"\d\"/g, '"is_vip":"1"');
}

//https://xiaoshuo.wtzw.com/api/v3/user/my-center?
if (url.includes('/user/my-center')) {
    body = body.replace(/\"year_vip_show\"\:\"\d\"/g, '"year_vip_show":"1"').replace(/\"vip_show_type\"\:\"\d+\"/g, '"vip_show_type":"40"').replace(/\"is_vip\"\:\"\d\"/g, '"is_vip":"1"');
    let obj = JSON.parse(body);
    delete obj.data.user_area.vip_info;
	//data['func_area'][0].type='core_func' 保留data['func_area'][0]   //data['func_area'][4].type='other' 保留data['func_area'][4]
    obj.data.func_area.length > 0 && (obj.data.func_area = obj.data.func_area.filter(item => item.type == "core_func" || item.type == "other"));//只留obj.data.func_area[0]core_func 和 .other
    body = JSON.stringify(obj);
}

//https://api-gw.wtzw.com/api/v2/vip/index?
if (url.includes('/vip/index')) {
    body = body.replace(/\"isvip\"\:\"\d\"/g, '"isvip":"1"').replace(/\"year_vip_show\"\:\"\d\"/g, '"year_vip_show":"1"').replace(/\"time\"\:\"\d\"/g, '"time":"3742732800"')
}

if (url.includes('/login/tourist')) {
    body = body.replace(/\"is_vip\"\:\"\d\"/g, '"is_vip":"1"');
}

if (url.includes('/user/get-role-adv-vip-info')) {
    body = body.replace(/\"year_vip_show\"\:\"\d\"/g, '"year_vip_show":"1"').replace(/\"isvip\"\:\"\d\"/g, '"isvip":"1"').replace(/\"isLifetimeVip\"\:\"\d\"/g, '"isLifetimeVip":"1"').replace(/\"type\"\:\"\d+\"/g, '"type":"40"');
}

if (url.includes('/bookshelf-adv/index')) {
    body = body.replace(/\"list\"\:\[.*?\]/g, '"list":[]');
}

if (url.includes('/user/page')) {
    body = body.replace(/\"year_vip_show\"\:\"\d\"/g, '"year_vip_show":"1"').replace(/\"is_vip\"\:\"\d\"/g, '"is_vip":"1"');
}

if (url.includes('/book/download')) {
    body = body.replace(/\"list\"\:\[.*?\]/g, '"list":[]');
}

if (url.includes('/reader-adv/index')) {
    body = body.replace(/\"reader_chapter_list\"\:\[.*?\]/g, '"reader_chapter_list":[]').replace(/\"reader_getcoin\"\:\[.*?\]/g, '"reader_getcoin":[]').replace(/\"reader_bottom_list\"\:\[.*?\]/g, '"reader_bottom_list":[]').replace(/\"reader_page_turn_list\"\:\[.*?\]/g, '"reader_page_turn_list":[]').replace(/\"reader_noad\"\:\[.*?\]/g, '"reader_noad":[]').replace(/\"reader_inchapter\"\:\[.*?\]/g, '"reader_inchapter":[]').replace(/\"feedback\"\:\[.*?\]/g, '"feedback":[]');
}

if (url.includes('/voice-adv/index')) {
    body = body.replace(/\"voice_top\"\:\[.*?\]/g, '"voice_top":[]').replace(/\"voice_bottom\"\:\[.*?\]/g, '"voice_bottom":[]');
}

if (url.includes('/get-player-info')) {
    body = body.replace(/\"voice_list\"\:\[.*?\]/g, '"voice_list":[]');
}

if (url.includes('/init-adv/index')) {
    body = body.replace(/\"coopenHighList\"\:\[.*?\]/g, '"coopenHighList":[]');
}

if (url.includes('/bookshelf-adv/index')) {
    body = body.replace(/\"bookshelf\"\:\[.*?\]/g, '"bookshelf":[]');
}

$done({body});


//{"data":{"user_area":{"type":"my_center","base_info":{"title":"我的","login":"1","avatar":"https://cdn.wtzw.com/bookimg/free/jpeg/avatar/230520/16845606937682177_360x360.jpeg","avatar_review_status":"0","nickname":"灰灰021325","nickname_review_status":"0","is_vip":"0","vip_show_type":"3","year_vip_show":"0","user_other_data":[{"num":"0","link_url":"freereader://user_fans?param={\"uid\":\"0\", \"id\":\"460195838\"}","title":"粉丝","type":"fans_data","stat_code":"my_followers_#_click"},{"num":"0","link_url":"freereader://user_follow?param={\"uid\":\"0\", \"id\":\"460195838\"}","title":"关注","type":"follow_data","stat_code":"my_following_#_click"}],"level":{"avatar":"https://cdn.wtzw.com/bookimg/free/images/app/1_0_0/portraits_default_photo_360x360.png"},"level_icon":"https://cdn.wtzw.com/bookimg/free/images/app/1_0_0/level/level_icon_4.png","tourist_mode":"2"},"grid_info":[{"num":"13201","title":"我的金币","link_url":"freereader://exchange?param={\"url\":\"https://xiaoshuo.wtzw.com/app-h5/freebook/web/my-card?type=1\"}","type":"my_coin","click_toast":"","coin_to_money":"1.32","stat_code":"my_#_coin_click"},{"num":"62","title":"今日金币","link_url":"freereader://exchange?param={\"url\":\"https://xiaoshuo.wtzw.com/app-h5/freebook/web/my-card?type=1\"}","type":"today_coin","click_toast":"","stat_code":"my_#_todaycoin_click"},{"num":"0","title":"今日听读(分钟)","link_url":"","type":"today_read","click_toast":"阅读、听书达到一定时长可获得金币奖励","stat_code":"my_#_todayreading_click"}],"vip_info":{"stat_code":"my_#_vip_click","vip_link_url":"freereader://webview?param={\"url\":\"https://xiaoshuo.wtzw.com/app-h5/freebook/vip?full_screen=1\u0026from=myvip\"}","activity_info":{"stat_code":"","icon_url":"","link_url":""},"vip_open_info":{"stat_code":"my_vip_5_click","show_type":"1","text":"¥6 开通","link_url":"freereader://webview?param={\"url\":\"https://xiaoshuo.wtzw.com/app-h5/freebook/vip?full_screen=1\u0026from=myvip5\"}"},"vip_business":[{"stat_code":"my_vip_1_click","icon_url":"https://cdn.wtzw.com/bookimg/free/images/app/1_0_0/my-center/v3/mycenter_icon_vip_privilege_read.png","link_url":"freereader://webview?param={\"url\":\"https://xiaoshuo.wtzw.com/app-h5/freebook/vip?full_screen=1\u0026from=myvip1\"}","text":"阅读听书无广告","red_point":""},{"stat_code":"my_vip_2_click","icon_url":"https://cdn.wtzw.com/bookimg/free/images/app/1_0_0/my-center/v3/mycenter_icon_vip_privilege_coin_exchange.png","link_url":"freereader://webview?param={\"url\":\"https://xiaoshuo.wtzw.com/app-h5/freebook/web/withdraw?source=myvip2\"}","text":"金币兑换会员","red_point":""},{"stat_code":"my_vip_3_click","icon_url":"https://cdn.wtzw.com/bookimg/free/images/app/1_0_0/my-center/v3/mycenter_icon_vip_privilege_more.png","link_url":"freereader://webview?param={\"url\":\"https://xiaoshuo.wtzw.com/app-h5/freebook/vip?full_screen=1\u0026from=myvip3\"}","text":"更多会员权益","red_point":""}]}},"func_area":[{"type":"core_func","show_type":"1","list":[{"type":"my_read_history","first_title":"阅读历史","icon_url":"https://cdn.wtzw.com/bookimg/free/images/app/1_0_0/my-center/v3/mycenter_read_history.png","link_url":"freereader://reading_record","stat_code":"my_#_readhistory_click","red_point_show_type":"0","red_point_text":"","number":"0"},{"type":"must_read_ticket","first_title":"必读票","icon_url":"https://cdn.wtzw.com/bookimg/free/images/app/1_0_0/my-center/v3/mycenter_must_read_ticket.png","link_url":"freereader://bookstore_ticket_record","stat_code":"my_ticketrecord_#_click","red_point_show_type":"0","red_point_text":"","number":"1"},{"type":"book_friend","first_title":"书友圈","icon_url":"https://cdn.wtzw.com/bookimg/free/images/app/1_0_0/my-center/v3/mycenter_book_friend.png","link_url":"freereader://book_friend?param={\"type\":\"2\",\"tab\":\"3\"}","stat_code":"my_bookfriends_none[action]","red_point_show_type":"0","red_point_text":"","number":"0"},{"type":"message","first_title":"消息通知","icon_url":"https://cdn.wtzw.com/bookimg/free/images/app/1_0_0/my-center/v3/mycenter_system_message.png","link_url":"freereader://message_notice?param={\"system_num\":\"0\", \"reply_num\":\"0\", \"like_num\":\"0\"}","stat_code":"my_#_message_click","red_point_show_type":"0","red_point_text":"","number":"0"}]},{"type":"banner","show_type":"2","banners_show_type":"0","list":[{"show_percent":"100","stat_code":"my_#_banner_click","image_url":"https://cdn.wtzw.com/bookimg/free/jpeg/mycenter-seven-read-summer.jpg","link_url":"freereader://webview?param={\"url\":\"https://xiaoshuo.wtzw.com/app-h5/freebook/activity/seven-day-read-habit/index?full_screen=1\"}"},{"show_percent":"100","stat_code":"my_#_banner_click","image_url":"https://cdn.wtzw.com/bookimg/free/jpeg/mycenter-summer-read-challenge.jpg","link_url":"freereader://webview?param={\"url\":\"https://xiaoshuo.wtzw.com/app-h5/freebook/activity/summer-read-challenge\"}"}]},{"type":"ads","show_type":"3","list":[{"discover_name":"幸运7抽奖","icon_url":"https://cdn-ad.wtzw.com/bookimg/free/images/cache/16595968792425625.png","deep_link_url":"","web_link_url":"freereader://webview?param={\"url\":\"https://xiaoshuo.wtzw.com/app-h5/freebook/lucky7/index?enable_close=1\"}","statistical_code":"xingyunqi","stat_code":"my_discovery_#[action]","stat_params":"{\"statid\":\"xingyunqi\"}","aid":"","cid":"","click_feedback_url":"","expose_feedback_url":"","third_click_feedback_url":"","third_expose_feedback_url":"","is_show_privacy":"0","show_privacy_type":"1","developer":"","privacy_detail_url":"https://xiaoshuo.wtzw.com/app-h5/freebook/ad/application?enable_close=1\u0026id=133","id":"133","app_version":"","user_permission":"","privacy_policy_url":"","user_permission_url":""},{"discover_name":"防诈骗指南","icon_url":"https://cdn-ad.wtzw.com/bookimg/free/images/cache/15832919765369430.png","deep_link_url":"","web_link_url":"freereader://webview?param={\"url\":\"https://xiaoshuo.wtzw.com/app-h5/freebook/article/fraud-prevention-guide\"}","statistical_code":"wode_faxian_fang","stat_code":"my_discovery_#[action]","stat_params":"{\"statid\":\"wode_faxian_fang\"}","aid":"","cid":"","click_feedback_url":"","expose_feedback_url":"","third_click_feedback_url":"","third_expose_feedback_url":"","is_show_privacy":"0","show_privacy_type":"1","developer":"","privacy_detail_url":"https://xiaoshuo.wtzw.com/app-h5/freebook/ad/application?enable_close=1\u0026id=81","id":"81","app_version":"","user_permission":"","privacy_policy_url":"","user_permission_url":""},{"discover_name":"幸运大转盘","icon_url":"https://cdn-ad.wtzw.com/bookimg/free/images/cache/15832917292607050.png","deep_link_url":"","web_link_url":"freereader://webview?param={\"url\":\"https://xiaoshuo.wtzw.com/app-h5/freebook/wheelSurf?enable_close=1\"}","statistical_code":"wode_faxian_shouji","stat_code":"my_discovery_#[action]","stat_params":"{\"statid\":\"wode_faxian_shouji\"}","aid":"","cid":"","click_feedback_url":"","expose_feedback_url":"","third_click_feedback_url":"","third_expose_feedback_url":"","is_show_privacy":"0","show_privacy_type":"1","developer":"","privacy_detail_url":"https://xiaoshuo.wtzw.com/app-h5/freebook/ad/application?enable_close=1\u0026id=79","id":"79","app_version":"","user_permission":"","privacy_policy_url":"","user_permission_url":""}]},{"type":"topic","show_type":"8","first_title":"书友圈・推书邀请","link_url":"freereader://book_friend_rescue?param={\"tab\":\"2\",\"id\":\"\",\"type\":\"2\"}","list":[{"icon_url":"https://cdn.wtzw.com/bookimg/free/images/upload/system_avatar/102406/159341148636596703_96x96.png","nick_title":"七猫书友_072650511005 邀请你拯救书荒","topic":"# 求短篇小说（不超过100章的那种），HE","topic_url":"freereader://book_friend_detail?param={\"id\":\"222482\", \"type\":\"2\"}","recommend_url":"freereader://bf_recommend_book?param={\"topic_id\":\"222482\",\"type\":\"2\",\"title\":\"求短篇小说（不超过100章的那种），HE\",\"from\":\"1\"}","stat_code":"my_savebooklist_1_click","stat_code_recommend":"my_saverecommend_1_click"},{"icon_url":"https://cdn.wtzw.com/bookimg/free/jpeg/avatar/230131/16751596701331892_96x96.jpeg","nick_title":"糖炒栗子mjq 邀请你拯救书荒","topic":"# 穿书#先婚后爱","topic_url":"freereader://book_friend_detail?param={\"id\":\"222477\", \"type\":\"2\"}","recommend_url":"freereader://bf_recommend_book?param={\"topic_id\":\"222477\",\"type\":\"2\",\"title\":\"穿书＃先婚后爱\",\"from\":\"1\"}","stat_code":"my_savebooklist_2_click","stat_code_recommend":"my_saverecommend_2_click"},{"icon_url":"https://cdn.wtzw.com/bookimg/free/jpeg/avatar/230721/16899497297044625_96x96.jpeg","nick_title":"卉 邀请你拯救书荒","topic":"# 双重山，有萌宝","topic_url":"freereader://book_friend_detail?param={\"id\":\"222466\", \"type\":\"2\"}","recommend_url":"freereader://bf_recommend_book?param={\"topic_id\":\"222466\",\"type\":\"2\",\"title\":\"双重山，有萌宝\",\"from\":\"1\"}","stat_code":"my_savebooklist_3_click","stat_code_recommend":"my_saverecommend_3_click"}]},{"type":"other","show_type":"4","list":[{"type":"person_comment","stat_code":"my_mycomment_#_click","icon_url":"https://cdn.wtzw.com/bookimg/free/images/app/1_0_0/my-center/v3/mycenter_my_comment.png","link_url":"freereader://person_comment","first_title":"我的评论","red_point":"0"},{"type":"read_preference","stat_code":"my_#_readlike_click","icon_url":"https://cdn.wtzw.com/bookimg/free/images/app/1_0_0/my-center/v3/mycenter_read_preferences.png","link_url":"freereader://reading_preference","first_title":"阅读喜好","red_point":"0"},{"type":"feedback","stat_code":"my_helpfeedback_#_click","icon_url":"https://cdn.wtzw.com/bookimg/free/images/app/1_0_0/my-center/v3/mycenter_feedback.png","link_url":"freereader://help_feedback","first_title":"帮助与反馈","red_point":"0"},{"type":"invite_friend","stat_code":"my_#_invitation_click","icon_url":"https://cdn.wtzw.com/bookimg/free/images/app/1_0_0/my-center/v3/mycenter_invite_friend.png","link_url":"freereader://invitation_invitefriend?param={\"url\":\"https://xiaoshuo.wtzw.com/app-h5/freebook/invite-friend\", \"type\":\"invite\"}","first_title":"邀请好友","red_point":"0"},{"type":"withdraw","stat_code":"my_coinwithdraw_#_click","icon_url":"https://cdn.wtzw.com/bookimg/free/images/app/1_0_0/my-center/usercenter_ico_gold.png","link_url":"freereader://webview?param={\"url\":\"https://xiaoshuo.wtzw.com/app-h5/freebook/web/withdraw?source=coin\"}","first_title":"金币提现","red_point":"0"},{"type":"become_author","stat_code":"my_#_author_click","icon_url":"https://cdn.wtzw.com/bookimg/free/images/app/1_0_0/my-center/v3/mycenter_become_author.png","link_url":"freereader://webview?param={\"url\":\"https://www.qimao.com/become_author.html\"}","first_title":"成为作家","red_point":"0"},{"type":"teenager_model","stat_code":"my_#_teenager_click","icon_url":"https://cdn.wtzw.com/bookimg/free/images/app/1_0_0/my-center/v3/mycenter_teenager_model.png","link_url":"freereader://teenager_model","first_title":"青少年模式","red_point":"0"},{"type":"setting","stat_code":"my_#_settings_click","icon_url":"https://cdn.wtzw.com/bookimg/free/images/app/1_0_0/my-center/v3/mycenter_setting.png","link_url":"freereader://settings","first_title":"设置","red_point":"0"}]}]}}