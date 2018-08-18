import { NotificationTags } from '../common/constants'
import * as userBll from '../bll/user'
import logger from '../common/logger'

const inProduction = process.env.NODE_ENV === 'production'

export default class Checker {
    static async allowReceivingNotificationsByUserId(userId) {
        const tags = await userBll.getTags(userId)
        return tags.filter(t => t.tag === NotificationTags.ReceiveNotifications).length > 0
    }

    static async allowReceivingNotificationsByWechatOpenId(openid) {
        const userId = await userBll.getUserIdByOpenId(openid)
        logger.info(`尝试发送通知给 ${userId}: ${openid}`)
        const result = await Checker.allowReceivingNotificationsByUserId(userId)
        if (!result) {
            logger.info(`通知检查结果为 ${result}，取消发送 = ${result === false}`)
            logger.info(`但是由于该用户 ${userId}: ${openid} 没有接收通知标签，取消发送。`)
        }
        return result
    }

    static async allowReceivingNotificationsByEmail(email) {
        logger.info(`check this user ${email} allowing receiving notifications...`)
        const userIds = await userBll.getUserIdsByEmail(email)
        for (let i = 0; i < userIds.length; i++) {
            // eslint-disable-next-line no-await-in-loop
            if (!(await Checker.allowReceivingNotificationsByUserId(userIds[i])
            )) {
                return false
            }
        }

        return true
    }

    static async checkAllowSendNotificationsByOpenId({ openid }) {
        if (inProduction) {
            return true
        }

        return await Checker.allowReceivingNotificationsByWechatOpenId(openid)
    }

    static async checkAllowSendNotificationsByWechatOpenId(wechat_openid) {
        if (inProduction) {
            return true
        }

        return await Checker.allowReceivingNotificationsByWechatOpenId(wechat_openid)
    }

    static async checkAllowSendNotificationsByUserId(user_id) {
        if (inProduction) {
            return true
        }

        return await Checker.allowReceivingNotificationsByUserId(user_id)
    }

    static async checkAllowSendNotificationsByEmail(email) {
        if (inProduction) {
            return true
        }

        return await Checker.allowReceivingNotificationsByEmail(email)
    }
}
