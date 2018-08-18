import * as wechat from '../common/wechat'
import * as userBll from '../bll/user'
import { NotificationTags } from '../common/constants'
import logger from '../common/logger'
import * as mail from '../common/mail'
import AOP from '../AOP'

const inProduction = process.env.NODE_ENV === 'production'

async function allowReceivingNotificationsByUserId(userId) {
    const tags = await userBll.getTags(userId)
    return tags.filter(t => t.tag === NotificationTags.ReceiveNotifications).length > 0
}

async function allowReceivingNotificationsByWechatOpenId(openid) {
    const userId = await userBll.getUserIdByOpenId(openid)
    logger.info(`尝试发送通知给 ${userId}: ${openid}`)
    const result = await allowReceivingNotificationsByUserId(userId)
    if (!result) {
        logger.info(`但是由于该用户 ${userId}: ${openid} 没有接收通知标签，取消发送。`)
    }
    return result
}

async function allowReceivingNotificationsByEmail(email) {
    const userIds = await userBll.getUserIdsByEmail(email)
    for (let i = 0; i < userIds.length; i++) {
        // eslint-disable-next-line no-await-in-loop
        if (!(await allowReceivingNotificationsByUserId(userIds[i]))) {
            return false
        }
    }

    return true
}

async function checkAllowSendNotificationsByOpenId({ openid }) {
    if (inProduction) {
        return true
    }

    return await allowReceivingNotificationsByWechatOpenId(openid)
}

async function checkAllowSendNotificationsByWechatOpenId({ wechat_openid }) {
    if (inProduction) {
        return true
    }

    return await allowReceivingNotificationsByWechatOpenId(wechat_openid)
}

async function checkAllowSendNotificationsByUserId({ user_id }) {
    if (inProduction) {
        return true
    }

    return await allowReceivingNotificationsByUserId(user_id)
}

async function checkAllowSendNotificationsByEmail(email) {
    if (inProduction) {
        return true
    }

    return await allowReceivingNotificationsByEmail(email)
}

export default class WechatPushNotificationChecker {
    static async start() {
        logger.info('通知检查已经启动')
        AOP.before()

        this.checkWechat()

        await this.checkMail()
    }

    static async checkMail() {
        mail.send = mail.send.before(async ToAddress => await checkAllowSendNotificationsByEmail(ToAddress))
        mail.sendCompanionEvaluationMail = mail.sendCompanionEvaluationMail.before(async mail => await checkAllowSendNotificationsByEmail(mail))
        mail.sendDayClassBeginMail = mail.sendDayClassBeginMail.before(async mail => await checkAllowSendNotificationsByEmail(mail))
        mail.sendFeedbackMail = mail.sendFeedbackMail.before(async to => await checkAllowSendNotificationsByEmail(to))
        mail.sendMinuteClassBeginMail = mail.sendMinuteClassBeginMail.before(async mail => await checkAllowSendNotificationsByEmail(mail))
        mail.sendNowClassBeginMail = mail.sendNowClassBeginMail.before(async mail => await checkAllowSendNotificationsByEmail(mail))
        mail.sendScheduleMail = mail.sendScheduleMail.before(async ToAddress => await checkAllowSendNotificationsByEmail(ToAddress))
    }

    static checkWechat() {
        wechat.sendTpl = wechat.sendTpl.before(checkAllowSendNotificationsByOpenId)
        wechat.sendSubTpl = wechat.sendSubTpl.before(checkAllowSendNotificationsByWechatOpenId)
        wechat.sendScheduleTpl = wechat.sendScheduleTpl.before(checkAllowSendNotificationsByWechatOpenId)
        wechat.sendCompanionEvaluationTpl = wechat.sendCompanionEvaluationTpl.before(checkAllowSendNotificationsByWechatOpenId)
        wechat.sendDayClassBeginTpl = wechat.sendDayClassBeginTpl.before(checkAllowSendNotificationsByWechatOpenId)
        wechat.sendFeedbackTpl = wechat.sendFeedbackTpl.before(async ({ to }) => await checkAllowSendNotificationsByUserId({ user_id: to }))
        wechat.sendMinuteClassBeginTpl = wechat.sendMinuteClassBeginTpl.before(checkAllowSendNotificationsByWechatOpenId)
        wechat.sendNowClassBeginTpl = wechat.sendNowClassBeginTpl.before(checkAllowSendNotificationsByWechatOpenId)
        wechat.sendRenewTpl = wechat.sendRenewTpl.before(checkAllowSendNotificationsByUserId)
        wechat.sendStudentEvaluationTpl = wechat.sendStudentEvaluationTpl.before(checkAllowSendNotificationsByWechatOpenId)
    }
}
