import * as wechat from '../common/wechat'
import logger from '../common/logger'
import Checker from './checker'
import AOP from '../AOP'

function checkWechat() {
    AOP.before()
    wechat.sendTpl = wechat.sendTpl.before(Checker.checkAllowSendNotificationsByOpenId)
    wechat.sendSubTpl = wechat.sendSubTpl.before(Checker.checkAllowSendNotificationsByWechatOpenId)
    wechat.sendScheduleTpl = wechat.sendScheduleTpl.before(Checker.checkAllowSendNotificationsByWechatOpenId)
    wechat.sendCompanionEvaluationTpl = wechat.sendCompanionEvaluationTpl.before(Checker.checkAllowSendNotificationsByWechatOpenId)
    wechat.sendDayClassBeginTpl = wechat.sendDayClassBeginTpl.before(Checker.checkAllowSendNotificationsByWechatOpenId)
    wechat.sendFeedbackTpl = wechat.sendFeedbackTpl.before(async (from, to) => await Checker.checkAllowSendNotificationsByUserId(to))
    wechat.sendMinuteClassBeginTpl = wechat.sendMinuteClassBeginTpl.before(Checker.checkAllowSendNotificationsByWechatOpenId)
    wechat.sendNowClassBeginTpl = wechat.sendNowClassBeginTpl.before(Checker.checkAllowSendNotificationsByWechatOpenId)
    wechat.sendRenewTpl = wechat.sendRenewTpl.before(Checker.checkAllowSendNotificationsByUserId)
    wechat.sendStudentEvaluationTpl = wechat.sendStudentEvaluationTpl.before(Checker.checkAllowSendNotificationsByWechatOpenId)
    logger.info('微信通知前检查环境已启动')
}

checkWechat()
module.exports = wechat
