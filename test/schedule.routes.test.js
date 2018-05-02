// Configure the environment and require Knex

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
        it('测试完后自动关闭', () => {
            should.not.exist(null)
        })
    })
})
