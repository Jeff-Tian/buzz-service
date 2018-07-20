const _ = require('lodash')
const { DYSMS } = require('waliyun')
const sms = DYSMS({ AccessKeyId: process.env.buzz_sms_access_key_id, AccessKeySecret: process.env.buzz_sms_access_key_secret })

module.exports = {
    // await sms.send({
    //     mobile: '18657198908',
    //     param: { code: '123123' },
    // })
    // await sms.send({
    //     mobile: '0014169314667',
    //     param: { code: '123123', expire: '30' },
    //     opt: {
    //         SignName: 'BuzzBuzz',
    //         TemplateCode: 'SMS_137670378',
    //     },
    // })
    async send({ mobile, param, opt }) {
        const { Code, Message } = await sms.sendSms({
            SignName: 'BuzzBuzz英语角',
            TemplateCode: 'SMS_127154352',
            PhoneNumbers: _.isArray(mobile) ? mobile : [mobile],
            ...opt,
            TemplateParam: JSON.stringify(param),
        })
        if (Code !== 'OK' && Message !== 'OK') throw new Error(`${Code}: ${Message}`)
    },
}
