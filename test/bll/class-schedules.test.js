import ClassScheduleBll from '../../server/bll/class-schedules'

describe('给定条件查询特定的班级', () => {
    const { server, should, chai, knex } = require('../test-helpers/prepare')

    before(async () => {
        await knex.migrate.latest()
        await knex.seed.run()
    })

    after(async () => {
        await knex.migrate.rollback()
    })

    it('查询某一用户的体验班级', async () => {
        const result = await ClassScheduleBll.getDemoClass(1)

        result.should.include.keys('class_id', 'start_time', 'end_time', 'tutors', 'topic')
    })
})
