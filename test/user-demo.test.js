import UserState, { UserStates } from '../server/bll/user-state'
import User from './test-helpers/user'
import * as common from './test-helpers/common'
import * as classHourBll from '../server/bll/class-hours'

const { server, should, chai, knex } = require('./test-helpers/prepare')

describe('用户入门指导时间与体验时间的保存与获取', () => {
    before(async () => {
        // await knex.migrate.rollback()
        await knex.migrate.latest()
        await knex.seed.run()
    })

    after(async () => {
        await knex.migrate.rollback()
    })

    it('可以保存用户的入门指导时间与体验时间', async () => {
        const result = await common.makeRequest('post', '/api/v1/user-demo/1', {
            training_time: new Date(),
            demo_time: new Date(),
        })

        result.status.should.eql(200)
    })
})
