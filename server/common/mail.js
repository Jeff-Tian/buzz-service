const _ = require('lodash')
const { DM } = require('waliyun')
const { redis } = require('./redis')

const dm = DM({
    AccessKeyId: process.env.buzz_aliyun_mail_id,
    AccessKeySecret: process.env.buzz_aliyun_mail_secret,
})

module.exports = {
    // FromAlias: 'BuzzBuzz',
    // ToAddress: '',
    // Subject: '排课确认通知',
    // HtmlBody: ``,
    async send(opt) {
        // TODO: 处理错误
        return await dm.singleSendMail({
            ReplyToAddress: true,
            AddressType: 1,
            AccountName: 'no-reply@service-cn.buzzbuzzenglish.com',
            FromAlias: 'BuzzBuzz',
            ...opt,
        })
    },
    // 发送验证邮件
    async sendVerificationMail(mail, name, digit = 4, expire = 30 * 60) {
        const code = String(_.random(10 ** (digit - 1), (10 ** digit) - 1))
        if (process.env.NODE_ENV !== 'test') {
            await this.send({
                ToAddress: mail,
                Subject: `${code} Verification code From BuzzBuzz`,
                HtmlBody: `Dear ${name},<br/>
 ${code} is your verification code.<br/>
 PS: this email was sent automatically, please don’t reply. If you have any questions, please contact your private advisor (peertutor@buzzbuzzenglish.com) .`,
            })
        }
        await redis.set(`mail:verify:${mail}`, code, 'ex', expire)
        return { code, expire }
    },
    // 验证
    async verifyByCode(mail, code) {
        if (!code) throw new Error('invalid code')
        const key = `mail:verify:${mail}`
        const v = await redis.get(key)
        if (!v) throw new Error('no verification code')
        if (String(code) !== String(v)) throw new Error('invalid verification code')
        await redis.del(key)
    },
}
