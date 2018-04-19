const mobileCommon = require('../common/mobile')

const sendVerificationSms = async ctx => {
    try {
        const { mobile, expire: setExpire } = ctx.request.body
        const { code, expire } = await mobileCommon.sendVerificationSms(mobile, undefined, (process.env.NODE_ENV !== 'production') ? setExpire : undefined)
        ctx.status = 200
        ctx.body = { code: (process.env.NODE_ENV === 'test') && code, expire }
    } catch (error) {
        console.error('sendVerificationSms error: ', error)
        ctx.status = 500
        ctx.body = error
    }
}

const verifyByCode = async ctx => {
    try {
        const { mobile, code } = ctx.request.body
        await mobileCommon.verifyByCode(mobile, code)
        ctx.status = 200
        ctx.body = { verified: true }
    } catch (error) {
        console.error('verifyByCode error: ', error)
        ctx.status = 500
        ctx.body = error
    }
}

module.exports = {
    sendVerificationSms,
    verifyByCode,
}
