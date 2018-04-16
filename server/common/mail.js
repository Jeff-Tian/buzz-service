const _ = require('lodash')

const mailgunPrivateKey = process.env.buzz_mailgun_private_key

const mailgun = require('mailgun-js')({ apiKey: mailgunPrivateKey, domain: 'service.buzzbuzzenglish.com' })

module.exports = {
    // await mail.send({to: 'xreamxu@gmail.com', subject: '123', text: 'good!'})
    async send(opt) {
        await mailgun.messages().send({
            from: 'BuzzBuzz <no-reply@service.buzzbuzzenglish.com>',
            ...opt,
        })
    },
}
