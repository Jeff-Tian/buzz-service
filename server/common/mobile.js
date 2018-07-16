const _ = require('lodash')
const phone = require('phone')
const countryList = require('../config/phone')
const { redis } = require('./redis')
const sms = require('./sms')

const Mobile = {
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
    // 中方: 18657198908 -> 18657198908
    // 外籍: 18657198908, CHN or CN -> 008618657198908
    normalize(inputMobile, inputCountry = 'CN') {
        const [mobile, country] = phone(inputMobile, inputCountry)
        if (!country) {
            const e = new Error('invalid mobile')
            e.statusCode = 400
            throw e
        } else if (country === 'CHN') {
            return [_.trimStart(mobile, '+86'), country]
        }
        return [_.replace(mobile, /^\+/, '00'), country]
    },
    async normalizeMiddleware(ctx, next) {
        const mobile = _.get(ctx.request.body, 'mobile')
        const country_short_name = _.get(ctx.request.body, 'country_short_name')
        const country_full_name = _.get(ctx.request.body, 'country_full_name')
        if (_.size(_.trim(mobile)) > 0) {
            _.set(ctx.request.body, 'mobile', _.head(Mobile.normalize(mobile, country_short_name || country_full_name)))
        }
        await next()
    },
    countryList() {
        return countryList
    },
}

module.exports = Mobile
