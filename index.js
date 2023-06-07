'use strict';

import * as Api from './api.js';
//api.js使用原生JavaScript实现所有功能，在浏览器环境和Node环境中均可运行
//环境要求：Chromium 103+ / Firefox 100+ / Node.js 17.3+

const loginParams = {
    user: 'szbdyb', //公共用户
    key: '4arcOUm6Wau+VuBX8g+IPg==', //公共钥匙
}

const queryParams = {
    buildingID: '001001000000007000002016', //宿舍编号
}

async function main() {
    await new Api.Login(loginParams).getToken();
    const status = await new Api.StatusQuery(queryParams).send();
    console.log(status.data[0])
}

main()