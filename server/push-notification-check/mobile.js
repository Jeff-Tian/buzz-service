import Checker from './checker'
import * as mobile from '../common/mobile'
import logger from '../common/logger'
import AOP from '../AOP'

function checkSms() {
    AOP.setBefore()
    mobile.sendMinuteClassBeginSms = mobile.sendMinuteClassBeginSms.beforeAsync(Checker.checkAllowSendNotificationsBySms)
}

checkSms()

module.exports = mobile
