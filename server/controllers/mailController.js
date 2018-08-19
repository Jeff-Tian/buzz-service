const mailCommon = require('../push-notification-check/mail')

const sendVerificationMail = async ctx => {
    try {
        const { mail, name, expire: setExpire } = ctx.request.body
        const { code, expire, error } = await mailCommon.sendVerificationMail(mail, name, undefined, (process.env.NODE_ENV !== 'production') ? setExpire : undefined)
        ctx.status = 200
        ctx.body = { code: (process.env.NODE_ENV === 'test') && code, expire, error }
    } catch (error) {
        console.error('sendVerificationMail error: ', error)
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

const send = async ctx => {
    try {
        const result = await mailCommon.send(ctx.request.body)
        ctx.status = 200
        ctx.body = result
    } catch (error) {
        console.error('mailSend error: ', error)
        ctx.status = 500
        ctx.body = error
    }
}

module.exports = {
    send,
    sendVerificationMail,
    verifyByCode,
}
