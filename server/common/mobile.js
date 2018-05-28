const _ = require('lodash')
const { redis } = require('./redis')
const sms = require('./sms')

module.exports = {
    // 发送验证短信
    async sendVerificationSms(mobile, digit = 4, expire = 30 * 60) {
        let error
        const code = String(_.random(10 ** (digit - 1), (10 ** digit) - 1))
        if (process.env.NODE_ENV !== 'test') {
            await sms.send({ mobile, param: { code } }).catch(e => {
                error = e
            })
        }
        await redis.set(`sms:verify:${mobile}`, code, 'ex', expire)
        return { code, expire, error }
    },
    // 验证
    async verifyByCode(mobile, code) {
        if (!code) throw new Error('invalid code')
        const key = `sms:verify:${mobile}`
        const v = await redis.get(key)
        if (!v) throw new Error('no verification code')
        if (String(code) !== String(v)) throw new Error('invalid verification code')
        await redis.del(key)
    },
}
