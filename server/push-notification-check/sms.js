import Checker from './checker'
import * as sms from '../common/sms'
import logger from '../common/logger'
import AOP from '../AOP'

function checkSms() {
    AOP.setBefore()
    sms.sendMinuteClassBeginSms = sms.sendMinuteClassBeginSms.beforeAsync(Checker.checkAllowSendNotificationsBySms)
}

checkSms()

module.exports = sms
