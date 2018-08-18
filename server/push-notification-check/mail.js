import Checker from './checker'
import * as mail from '../common/mail'
import logger from '../common/logger'
import AOP from '../AOP'

function checkMail() {
    AOP.before()
    mail.send = mail.send.before(async ToAddress => await Checker.checkAllowSendNotificationsByEmail(ToAddress))
    mail.sendCompanionEvaluationMail = mail.sendCompanionEvaluationMail.before(async mail => await Checker.checkAllowSendNotificationsByEmail(mail))
    mail.sendDayClassBeginMail = mail.sendDayClassBeginMail.before(async mail => await Checker.checkAllowSendNotificationsByEmail(mail))
    mail.sendFeedbackMail = mail.sendFeedbackMail.before(async to => await Checker.checkAllowSendNotificationsByEmail(to))
    mail.sendMinuteClassBeginMail = mail.sendMinuteClassBeginMail.before(async mail => await Checker.checkAllowSendNotificationsByEmail(mail))
    mail.sendNowClassBeginMail = mail.sendNowClassBeginMail.before(async mail => await Checker.checkAllowSendNotificationsByEmail(mail))
    mail.sendScheduleMail = mail.sendScheduleMail.before(async ToAddress => await Checker.checkAllowSendNotificationsByEmail(ToAddress))

    logger.info('邮件通知前检查环境已启动')
}

checkMail()

export default mail
