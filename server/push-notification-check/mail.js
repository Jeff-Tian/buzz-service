import Checker from './checker'
import * as mail from '../common/mail'
import logger from '../common/logger'
import AOP from '../AOP'

function checkMail() {
    AOP.before()
    mail.send = mail.send.before(async ({ ToAddress }) => await Checker.checkAllowSendNotificationsByEmail(ToAddress))
    mail.sendCompanionEvaluationMail = mail.sendCompanionEvaluationMail.before(Checker.checkAllowSendNotificationsByEmail)
    mail.sendDayClassBeginMail = mail.sendDayClassBeginMail.before(Checker.checkAllowSendNotificationsByEmail)
    mail.sendFeedbackMail = mail.sendFeedbackMail.before(async (from, to) => await Checker.checkAllowSendNotificationsByEmail(to))
    mail.sendMinuteClassBeginMail = mail.sendMinuteClassBeginMail.before(Checker.checkAllowSendNotificationsByEmail)
    mail.sendNowClassBeginMail = mail.sendNowClassBeginMail.before(Checker.checkAllowSendNotificationsByEmail)
    mail.sendScheduleMail = mail.sendScheduleMail.before(Checker.checkAllowSendNotificationsByEmail)

    logger.info('邮件通知前检查环境已启动')
}

checkMail()

module.exports = mail
