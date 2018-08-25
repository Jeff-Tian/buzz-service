const common = require('./test-helpers/common')
const PATH = '/api/v1/users'
const bluebird = require('bluebird')

const {server, should, chai, knex} = require('./test-helpers/prepare')
// Rollback, commit and populate the test database before each test
describe('手机验证码登录', () => {
    beforeEach(async () => {
        await knex.migrate.latest()
        await knex.seed.run()
    })

    afterEach(async () => {
        await knex.migrate.rollback()
        // await server.close()
    })

    describe('手机号验证码登录/使用验证码更新手机号', () => {
        const cnMobile = '18600000000'
        const cnMobile2 = '18600000001'
        const foreignMobile = '0014169314667'
        let cnUserId
        let foreignUserId
        let foreignUserId2
        beforeEach(async () => {
            cnUserId = (await common.makeRequest('post', '/api/v1/users', {
                mobile: cnMobile,
                name: cnMobile,
                role: 's',
            })).body
            foreignUserId = (await common.makeRequest('post', '/api/v1/users', {
                mobile: foreignMobile,
                name: foreignMobile,
                role: 's',
            })).body
            foreignUserId2 = (await common.makeRequest('post', '/api/v1/users', {
                mobile: foreignMobile,
                name: `${foreignMobile}-2`,
                role: 's',
            })).body
        })
        it('使用验证码更新手机号', async () => {
            const {body: {code}} = await common.makeRequest('post', '/api/v1/mobile/sms', {
                mobile: cnMobile,
            })
            const {body} = await common.makeRequest('put', `/api/v1/users/${cnUserId}`, {
                mobile: cnMobile,
                code,
            })
            body.user_id.should.equal(cnUserId)
            body.mobile_confirmed.should.equal(1)
        })
        it('中国手机号单用户验证码登录', async () => {
            const {body: {code}} = await common.makeRequest('post', '/api/v1/mobile/sms', {
                mobile: cnMobile,
            })
            const {body} = await common.makeRequest('post', `${PATH}/signInByMobileCode`, {
                mobile: cnMobile,
                code,
            })
            body.user_id.should.equal(cnUserId)
            body.mobile_confirmed.should.equal(1)
        })
        it('外国手机号多用户验证码登录', async () => {
            const {body: {code}} = await common.makeRequest('post', '/api/v1/mobile/sms', {
                mobile: foreignMobile,
            })
            const {body} = await common.makeRequest('post', `${PATH}/signInByMobileCode`, {
                mobile: foreignMobile,
                code,
            })
            await bluebird.map(body, async i => {
                const {body} = (await common.makeRequest('post', `${PATH}/signInByMobileCode`, {
                    mobile: foreignMobile,
                    token: i.token,
                }))
                body.user_id.should.equal(i.user_id)
                body.mobile_confirmed.should.equal(1)
            })
        })
        it('中国手机号单用户验证码自动注册', async () => {
            const {body: {code}} = await common.makeRequest('post', '/api/v1/mobile/sms', {
                mobile: cnMobile2,
            })
            const {body} = await common.makeRequest('post', `${PATH}/signInByMobileCode`, {
                mobile: cnMobile2,
                code,
            })
            body.mobile.should.equal(cnMobile2)
            body.mobile_confirmed.should.equal(1)
        })
    })
})
