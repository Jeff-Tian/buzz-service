import chai from 'chai'
import ClassHourBll from '../../server/bll/class-hours'
import ClassHourHistoryBll from '../../server/bll/class-hour-history'

const env = process.env.NODE_ENV || 'test'
const config = require('../../knexfile')[env]
const knex = require('knex')(config)

const should = chai.should()

describe('课时数历史变化详情', () => {
    before(async () => {
        await knex.migrate.latest()
    })
    after(async () => {
        await knex.migrate.rollback()
    })

    it('可以根据用户编号查询用户的课时变化详情', async () => {
        await ClassHourBll.charge(null, 1, 4.5, 'test')
        await ClassHourBll.consume(null, 1, 2, 'test again')

        const history = await ClassHourHistoryBll.getHistoryByUserId(1)

        history.data.length.should.gt(0)
        history.data[0].should.include.keys('timestamp', 'event', 'amount', 'remark')
    })
})
