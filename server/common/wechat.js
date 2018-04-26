const _ = require('lodash')
const fs = require('fs')
const os = require('os')
const path = require('path')
const Client = require('co-wechat-oauth')
const API = require('co-wechat-api')
const { redis } = require('./redis')
const { getWechatByUserIds } = require('../controllers/usersController')

let appId = process.env.buzz_wechat_appid
let appSecret = process.env.buzz_wechat_secret

if (process.env.NODE_ENV === 'staging') {
    appId = process.env.buzz_wechat_test_appid
    appSecret = process.env.buzz_wechat_test_secret
}

const apiName = `wechat:api:${appId}`
const api = new API(
    appId, appSecret,
    async () => JSON.parse(await redis.get(apiName)),
    async token => {
        await redis.set(apiName, JSON.stringify(token))
    }
)

const clientName = `wechat:oauth:${appId}`
const client = new Client(
    appId, appSecret,
    async openid => JSON.parse(await redis.get(`${clientName}:${openid}`)),
    async (openid, token) => {
        await redis.set(`${clientName}:${openid}`, JSON.stringify(token), 'ex', _.get(token, 'expires_in', 7200))
    }
)

module.exports = {
    api,
    client,
    async getJsConfig(arg) {
        return await api.getJsConfig(arg)
    },
    async getMedia({ serverId }) {
        return await api.getMedia(serverId)
    },
    authUrl(redirectUrl, state) {
        return client.getAuthorizeURL(redirectUrl, state, 'snsapi_base')
    },
    async code(code) {
        const { data } = await client.getAccessToken(code)
        return data
    },
    async userInfo(openid) {
        return await client.getUser(openid)
    },
    async sendTpl({ openid, id, url, color, data }) {
        return await api.sendTemplate(openid, id, url, color, data)
    },
    // 续费通知
    async sendRenewTpl(user_id, class_hours) {
        const { wechat_openid, name } = _.get(await getWechatByUserIds([user_id]), '0') || {}
        return await this.sendTpl({
            openid: wechat_openid,
            id: '5V00NpImSvNjWATqXCEw7CdbL02Kt4gxZKd5WxDaWDY',
            url: 'https://j.youzan.com/BVPgcY',
            data: {
                first: { value: '亲爱的用户\n' },
                keyword1: { value: name || '' },
                keyword2: { value: 'BuzzBuzz 语言角' },
                keyword3: { value: class_hours || 0 },
                remark: { value: '\n为了不影响你的后续排课，请提前充值。\n充值>>' },
            },
        })
    },
}
