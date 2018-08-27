const _ = require('lodash')
const { DYSMS } = require('waliyun')
const sms = DYSMS({ AccessKeyId: process.env.buzz_sms_access_key_id, AccessKeySecret: process.env.buzz_sms_access_key_secret })

module.exports = {
    // await sms.sendVerification({
    //     mobile: '18657198908',
    //     param: { code: '123123' },
    // })
    // await sms.sendVerification({
    //     mobile: '0014169314667',
    //     param: { code: '123123', expire: '30' },
    //     opt: {
    //         SignName: 'BuzzBuzz',
    //         TemplateCode: 'SMS_137670378',
    //     },
    // })
    async send(mobile, sign, tpl, param = {}) {
        const { Code, Message } = await sms.sendSms({
            PhoneNumbers: _.isArray(mobile) ? mobile : [mobile],
            SignName: sign,
            TemplateCode: tpl,
            TemplateParam: JSON.stringify(param),
        })
        if (Code !== 'OK' && Message !== 'OK') throw new Error(`${Code}: ${Message}`)
    },
    async sendMinuteClassBeginSms(mobile) {
        await this.send(mobile, 'BuzzBuzz', 'SMS_142954112')
    },
}
