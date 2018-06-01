import * as userBookings from './test-data-generators/user-bookings'

const common = require('./test-helpers/common')
const { server, should, chai, knex } = require('./test-helpers/prepare')
const PATH = '/api/v1/users'
const userBll = require('../server/bll/user')
const userHelper = require('./test-helpers/user')

describe('routes: users', () => {
    before(async () => {
        await knex.migrate.rollback()
        await knex.migrate.latest()
        await knex.seed.run()
    })

    after(async () => {
        await knex.migrate.rollback()
    })

    describe('自动给用户打标签的场景', () => {
        it('新注册的学生账号自动打上 leads 标签', async () => {
            const userId = (await userHelper.createUserRequest({
                name: 'leads example',
                role: userBll.MemberType.Student,
            })).body
            const userDetail = await userBll.get(userId)
            userDetail.tags.should.eql('leads')
        })

        it('新注册的外籍语伴账号不会被打上 leads 标签', async () => {
            const userId = (await userHelper.createUserRequest({
                name: 'not leads',
                role: userBll.MemberType.Companion,
            })).body
            const userDetail = await userBll.get(userId)
            should.equal(userDetail.tags, null)
        })
    })
})
