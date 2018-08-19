import UserState, { UserStates } from '../server/bll/user-state'
import User from './test-helpers/user'
import * as common from './test-helpers/common'
import * as classHourBll from '../server/bll/class-hours'

const { server, should, chai, knex } = require('./test-helpers/prepare')
const PATH = '/api/v1/users'

describe('用户状态', () => {
    before(async () => {
        // await knex.migrate.rollback()
        await knex.migrate.latest()
        await knex.seed.run()
    })

    after(async () => {
        await knex.migrate.rollback()
    })

    async function testPotential() {
        const userId = (await User.createUserRequest({
            name: 'hahaha',
        })).body

        userId.should.gt(0)

        const result = await UserState.getLatest(userId)
        result.state.should.eql(UserStates.Potential)

        return userId
    }

    it('新用户会自动进入 potential 状态', async () => {
        await testPotential()
    })

    async function testLead() {
        const userId = await testPotential()

        await common.makeRequest('put', `/api/v1/users/${userId}`, {
            mobile: '17717373333',
        }, { user: process.env.BASIC_NAME, pass: process.env.BASIC_PASS })
        const result = await UserState.getLatest(userId)
        result.state.should.eql(UserStates.Lead)

        return userId
    }

    it('新注册的用户填写手机号后，会变成 Leads 状态', async () => {
        await testLead()
    })

    async function testDemo() {
        const userId = await testLead()
        await common.makeRequest('put', `/api/v1/user-balance/${userId}`, {
            class_hours: 1,
        })
        const result = await UserState.getLatest(userId)
        result.state.should.eql(UserStates.Demo)

        return userId
    }

    it('Leads 第一次获得课时数，会变成 Demo 状态', async () => {
        await testDemo()
    })

    it('Demo 用户消耗完课时，就会进入 待购买 状态', async () => {
        const userId = await testDemo()
        await classHourBll.consume(null, userId, 1)
        const result = await UserState.getLatest(userId)
        result.state.should.eql(UserStates.WaitingForPurchase)
    })
})
