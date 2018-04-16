const { DM } = require('waliyun')

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
        return await dm.singleSendMail({
            ReplyToAddress: true,
            AddressType: 1,
            AccountName: 'no-reply@service-cn.buzzbuzzenglish.com',
            FromAlias: 'BuzzBuzz',
            ...opt,
        })
    },

}
