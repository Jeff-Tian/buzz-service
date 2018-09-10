const _ = require('lodash')
const phone = require('phone')
const { iso3166_data } = require('phone')
const { redis } = require('./redis')
const sms = require('./sms')

const Mobile = {
    // 发送验证短信
    async sendVerificationSms(mobile, mobile_country, digit = 4, expire = 30 * 60) {
        let error
        const code = String(_.random(10 ** (digit - 1), (10 ** digit) - 1))
        if (process.env.NODE_ENV !== 'test') {
            const isCN = mobile_country === 'CHN'
            await sms.send(mobile, isCN ? 'BuzzBuzz英语角' : 'BuzzBuzz', isCN ? 'SMS_127154352' : 'SMS_137670378', {
                code,
                expire: '30',
            }).catch(e => {
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
    normalize(inputMobile, inputCountry) {
        let normalInputMobile = inputMobile
        let normalInputCountry = inputCountry
        if (!inputCountry) {
            if (_.startsWith(inputMobile, '00')) {
                normalInputMobile = _.replace(inputMobile, /^00/, '+')
            } else {
                normalInputCountry = 'CHN'
            }
        }
        const [mobile, country] = phone(normalInputMobile, normalInputCountry)
        if (!country) {
            // const e = new Error('invalid mobile')
            // e.statusCode = 400
            // throw e
            return [inputMobile, 'CHN']
        } else if (country === 'CHN') {
            return [_.trimStart(mobile, '+86'), country]
        }
        return [_.replace(mobile, /^\+/, '00'), country]
    },
    // 拆分
    // 0014169314667 -> 4169314667, {
    //   "country_code": "1",
    //   "country_full_name": "Canada",
    //   "country_long_name": "CAN",
    //   "country_short_name": "CA",
    // }
    split(inputMobile) {
        const fullMobile = _.startsWith(inputMobile, '00') ? _.replace(inputMobile, /^00/, '+') : `+86${inputMobile}`
        const [mobile, country] = phone(fullMobile)
        if (!country) {
            return {
                mobile: _.trimStart(fullMobile, '+').replace(/^86$/, ''),
                country: _.find(Mobile.countryList, ['country_long_name', 'CHN']),
            }
        }
        const country_full = _.find(Mobile.countryList, ['country_long_name', country])
        return {
            mobile: _.trimStart(mobile, `+${_.get(country_full, 'country_code')}`).replace(/^86$/, ''),
            country: country_full,
        }
    },
    async normalizeMiddleware(ctx, next) {
        const mobile = _.get(ctx.request.body, 'mobile')
        const country_short_name = _.get(ctx.request.body, 'country_short_name')
        const country_full_name = _.get(ctx.request.body, 'country_full_name')
        if (_.size(_.trim(mobile)) > 0) {
            const [normalizedMobile, country] = Mobile.normalize(mobile, country_short_name || country_full_name)
            _.set(ctx.request.body, 'mobile', normalizedMobile)
            _.set(ctx.request.body, 'mobile_country', country)
        }
        await next()
    },
    countryList: _.map(iso3166_data, i => ({
        mobile_length: i.phone_number_lengths,
        mobile_begin_with: i.mobile_begin_with,
        country_full_name: i.country_name,
        country_long_name: i.alpha3,
        country_short_name: i.alpha2,
        country_code: i.country_code,
    })),
    async sendMinuteClassBeginSms(full) {
        const { mobile, country } = Mobile.split(full)
        if (_.get(country, 'country_short_name') !== 'CN') {
            await sms.send(mobile, 'BuzzBuzz', 'SMS_142954112')
        } else {
            await sms.send(mobile, 'BuzzBuzz', 'SMS_142954443')
        }
    },
}

module.exports = Mobile
