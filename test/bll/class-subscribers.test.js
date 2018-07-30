import Groups from '../test-data-generators/groups'
import ClassScheduleBll from '../../server/bll/class-schedules'

describe('班级课程订阅者', () => {
    const { server, should, chai, knex } = require('../test-helpers/prepare')

    before(async () => {
        await knex.migrate.latest()
        await knex.seed.run()
    })

    after(async () => {
        await knex.migrate.rollback()
    })

    it('用班级编号查找所有订阅者', async () => {
        const { class_id } = await Groups.createClass([1], [2, 3, 4], [5, 6, 7])

        const subscribersInfo = await ClassScheduleBll.getSubscribers(class_id)
        subscribersInfo.length.should.eql(3)
        subscribersInfo.map(o => o.user_id).should.eql([5, 6, 7])
    })
})
