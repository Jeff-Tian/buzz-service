const mailCommon = require('../common/mail')

const sendVerifyMail = async ctx => {
    try {
        const { mail, expire: setExpire } = ctx.request.body
        const { code, expire } = await mailCommon.sendVerifyMail(mail, undefined, (process.env.NODE_ENV !== 'production') ? setExpire : undefined)
        ctx.status = 200
        ctx.body = { code: (process.env.NODE_ENV === 'test') && code, expire }
    } catch (error) {
        console.error('sendVerifyMail error: ', error)
        ctx.status = 500
        ctx.body = error
    }
}

const verifyByCode = async ctx => {
    try {
        const { mail, code } = ctx.request.body
        await mailCommon.verifyByCode(mail, code)
        ctx.status = 200
        ctx.body = { verified: true }
    } catch (error) {
        console.error('verifyByCode error: ', error)
        ctx.status = 500
        ctx.body = error
    }
}

module.exports = {
    sendVerifyMail,
    verifyByCode,
}
