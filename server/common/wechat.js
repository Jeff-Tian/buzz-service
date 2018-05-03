const _ = require('lodash')
const fs = require('fs')
const os = require('os')
const path = require('path')
const bluebird = require('bluebird')
const Client = require('co-wechat-oauth')
const API = require('co-wechat-api')
const { redis } = require('./redis')
const timeHelper = require('./time-helper')
const config = require('../config')

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
    async  sendRenewTpl(user_id, class_hours) {
        const users = await require('../bll/user').getWechatByUserIds([user_id])
        const { wechat_openid, name } = _.get(users, '0') || {}

        const data = {
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
        }
        await this.sendTpl(data)
    },
    // 外籍给学生的课程评价通知
    async sendCompanionEvaluationTpl(wechat_openid, class_id, class_topic, class_end_time) {
        const end_time = timeHelper.zhEndTime(class_end_time)
        const data = {
            openid: wechat_openid,
            id: '2_kY3e151Exjf9uGmVb8bZARsibKH_3warWNN4mWW30',
            url: `${config.endPoints.buzzCorner}/class/foreign/${class_id}`,
            data: {
                first: { value: '恭喜您完成了今天的课程\n' },
                keyword1: { value: class_topic || '' },
                keyword2: { value: end_time || '' },
                remark: { value: '\n请对你的外籍语伴和课程进行评价。\n去评价>>' },
            },
        }
        await this.sendTpl(data)
    },
    // 学生给外籍的课程评价通知
    async sendStudentEvaluationTpl(wechat_openid, class_id, class_topic, class_end_time, companion_id) {
        const end_time = timeHelper.zhEndTime(class_end_time)
        const data = {
            openid: wechat_openid,
            id: '2_kY3e151Exjf9uGmVb8bZARsibKH_3warWNN4mWW30',
            url: `${config.endPoints.buzzCorner}/class/evaluation/${companion_id}/${class_id}`,
            data: {
                first: { value: '恭喜您完成了今天的课程\n' },
                keyword1: { value: class_topic || '' },
                keyword2: { value: end_time || '' },
                remark: { value: '\n请对你的外籍语伴和课程进行评价。\n去评价>>' },
            },
        }
        await this.sendTpl(data)
    },
    // 开课提醒通知1 课程开始时间前24小时或小于24小时
    async sendDayClassBeginTpl(wechat_openid, name, class_id, class_topic, class_start_time, class_end_time) {
        const start_time = timeHelper.zhStartEndTime(class_start_time, class_end_time)
        const fromNow = timeHelper.zhFromNow(class_start_time)
        const data = {
            openid: wechat_openid,
            id: 'jqjLPR5NICbT_PZxSlwNts0DNnzcMonKcVLOfgydrmo',
            url: `${config.endPoints.buzzCorner}/class/${class_id}`,
            data: {
                first: { value: '亲爱的用户\n' },
                keyword1: { value: class_topic || '' },
                keyword2: { value: name || '' },
                remark: { value: `课程时间：${start_time}\n\n在 ${fromNow}即将开始\n为了良好的体验请完成课前准备并准时参加。\n查看课程详情>>` },
            },
        }
        await this.sendTpl(data)
    },
    // 开课提醒通知2 课程开始时间前30分钟或小于30分钟
    async sendMinuteClassBeginTpl(wechat_openid, name, class_id, class_topic, class_start_time, class_end_time) {
        const start_time = timeHelper.zhStartEndTime(class_start_time, class_end_time)
        const fromNow = timeHelper.zhFromNow(class_start_time)
        const data = {
            openid: wechat_openid,
            id: 'jqjLPR5NICbT_PZxSlwNts0DNnzcMonKcVLOfgydrmo',
            url: `${config.endPoints.buzzCorner}/class/${class_id}`,
            data: {
                first: { value: '亲爱的用户\n' },
                keyword1: { value: class_topic || '' },
                keyword2: { value: name || '' },
                remark: { value: `课程时间：${start_time}\n\n在 ${fromNow}即将开始，请务必准时参加。\n查看课程详情>>` },
            },
        }
        await this.sendTpl(data)
    },
}
