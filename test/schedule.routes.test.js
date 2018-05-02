// Configure the environment and require Knex
const scheduling = require('./test-helpers/scheduling')
const { server, should, chai, knex } = require('./test-helpers/prepare')

console.log('knex = ', knex)
describe('routes: scheduling 相关测试', () => {
    beforeEach(async () => {
        await knex.migrate.rollback()
        await knex.migrate.latest()
        await knex.seed.run()
        console.log('数据库准备好了')
    })

    afterEach(async () => {
        await knex.migrate.rollback()
        console.log('数据库恢复原状了')
    })

    after(async () => {
        console.log('测试完毕')
        await server.close()
    })

    describe('booking 测试', () => {
        it('在用户的时间安排列表里有一个伙伴的国籍字段', async () => {
            let res = await scheduling.listScheduleForStudentRequest(1)
            res.body.length.should.gt(0)
            res.body[0].should.include.keys('companion_country')

            res = await scheduling.listScheduleForCompanionRequest(1)
            res.body.length.should.gt(0)
            res.body[0].should.include.keys('companion_country')
        })
    })
})
