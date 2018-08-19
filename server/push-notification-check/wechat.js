import * as wechat from '../common/wechat'
import logger from '../common/logger'
import Checker from './checker'
import AOP from '../AOP'

function checkWechat() {
    AOP.setBefore()
    wechat.sendTpl = wechat.sendTpl.beforeAsync(Checker.checkAllowSendNotificationsByOpenId)
    wechat.sendSubTpl = wechat.sendSubTpl.beforeAsync(Checker.checkAllowSendNotificationsByWechatOpenId)
    wechat.sendScheduleTpl = wechat.sendScheduleTpl.beforeAsync(Checker.checkAllowSendNotificationsByWechatOpenId)
    wechat.sendCompanionEvaluationTpl = wechat.sendCompanionEvaluationTpl.beforeAsync(Checker.checkAllowSendNotificationsByWechatOpenId)
    wechat.sendDayClassBeginTpl = wechat.sendDayClassBeginTpl.beforeAsync(Checker.checkAllowSendNotificationsByWechatOpenId)
    wechat.sendFeedbackTpl = wechat.sendFeedbackTpl.beforeAsync(async (from, to) => await Checker.checkAllowSendNotificationsByUserId(to))
    wechat.sendMinuteClassBeginTpl = wechat.sendMinuteClassBeginTpl.beforeAsync(Checker.checkAllowSendNotificationsByWechatOpenId)
    wechat.sendNowClassBeginTpl = wechat.sendNowClassBeginTpl.beforeAsync(Checker.checkAllowSendNotificationsByWechatOpenId)
    wechat.sendRenewTpl = wechat.sendRenewTpl.beforeAsync(Checker.checkAllowSendNotificationsByUserId)
    wechat.sendStudentEvaluationTpl = wechat.sendStudentEvaluationTpl.beforeAsync(Checker.checkAllowSendNotificationsByWechatOpenId)
    logger.info('微信通知前检查环境已启动')
}

checkWechat()
module.exports = wechat
