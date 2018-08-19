import Checker from './checker'
import * as mail from '../common/mail'
import logger from '../common/logger'
import AOP from '../AOP'

function checkMail() {
    AOP.setBefore()
    mail.send = mail.send.beforeAsync(async ({ ToAddress }) => await Checker.checkAllowSendNotificationsByEmail(ToAddress))
    mail.sendCompanionEvaluationMail = mail.sendCompanionEvaluationMail.beforeAsync(Checker.checkAllowSendNotificationsByEmail)
    mail.sendDayClassBeginMail = mail.sendDayClassBeginMail.beforeAsync(Checker.checkAllowSendNotificationsByEmail)
    mail.sendFeedbackMail = mail.sendFeedbackMail.beforeAsync(async (from, to) => await Checker.checkAllowSendNotificationsByEmail(to))
    mail.sendMinuteClassBeginMail = mail.sendMinuteClassBeginMail.beforeAsync(Checker.checkAllowSendNotificationsByEmail)
    mail.sendNowClassBeginMail = mail.sendNowClassBeginMail.beforeAsync(Checker.checkAllowSendNotificationsByEmail)
    mail.sendScheduleMail = mail.sendScheduleMail.beforeAsync(Checker.checkAllowSendNotificationsByEmail)

    logger.info('邮件通知前检查环境已启动')
}

checkMail()

module.exports = mail
