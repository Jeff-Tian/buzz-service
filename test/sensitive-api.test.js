const common = require('./test-helpers/common')
const { server, should, chai, knex } = require('./test-helpers/prepare')
const PATH = '/api/v1/users'

describe('routes: users', () => {
    before(async () => {
        await knex.migrate.rollback()
        await knex.migrate.latest()
        await knex.seed.run()
    })

    after(async () => {
        await knex.migrate.rollback()
    })

    // Here comes the first test
    describe(`GET ${PATH}`, () => {
        it('如果没有检测到验证信息，则把手机号打码', async () => {
            const res = await common.makeRequest('get', `${PATH}`)

            res.status.should.eql(200)
            res.type.should.eql('application/json')
            res.body.length.should.eql(5)
            res.body[0].should.include.keys('user_id', 'name', 'created_at', 'role', 'avatar', 'facebook_id', 'wechat_data', 'class_hours')
            res.body[0].mobile.substr(3, 4).should.eql('****')
        })

        it('如果检测到验证信息并通过，则把原始手机号返回', async () => {
            const res = await common.makeRequest('get', `${PATH}`, {}, {
                user: process.env.BASIC_NAME,
                pass: process.env.BASIC_PASS,
            })

            res.status.should.eql(200)
            res.body[0].mobile.should.eql('17717373368')
        })
    })
})
