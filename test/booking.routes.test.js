// Configure the environment and require Knex
const classHours = require('./test-helpers/class-hour')

const booking = require('./test-helpers/bookings')
const user = require('./test-helpers/user')
const moment = require('moment')
const env = process.env.NODE_ENV || 'test'
const config = require('../knexfile')[env]
const server = require('../server/index')
const knex = require('knex')(config)
const PATH = '/api/v1/bookings'
// Require and configure the assertion library
const chai = require('chai')
const should = chai.should()
const chaiHttp = require('chai-http')
chai.use(chaiHttp)
// Rollback, commit and populate the test database before each test
describe('routes: bookings', () => {
    beforeEach(() => knex.migrate
        .rollback()
        .then(() => knex.migrate.latest())
        .then(() => knex.seed.run()))

    afterEach(() => knex.migrate.rollback())

    after(done => {
        server.close()
        done()
    })

    describe(`POST ${PATH}/batch/:user_id`, () => {
        it('should not allow inserting bookings for non-exist user', async () => {
            const now = moment()

            try {
                await booking.batchCreateBookingsRequest({
                    user_id: 100,
                    start_time: now.clone().add(50, 'h').set('minute', 0).set('second', 0),
                    end_time: now.clone().add(50, 'h').set('minute', 30).set('second', 0),
                })
            } catch (ex) {
                should.exist(ex)
                ex.status.should.eql(400)
                ex.response.text.should.eql('User with id 100 not found')
            }
        })

        it('should not allow inserting bookings for users without sufficient class hours', async () => {
            const response = await user.createUserRequest({
                name: 'test user',
                role: 's',
            })

            should.exist(response.body)
            const userId = response.body

            const now = moment()

            try {
                const r = await booking.batchCreateBookingsRequest({
                    user_id: userId,
                    start_time: now.clone().add(50, 'h').set('minute', 0).set('second', 0),
                    end_time: now.clone().add(50, 'h').set('minute', 30).set('second', 0),
                })
            } catch (ex) {
                should.exist(ex)
                ex.status.should.eql(400)
                ex.response.text.should.eql(`balance class hours of ${userId} is only null`)
            }
        })

        it('批量插入4条预约需求', async () => {
            const response = await user.createUserRequest({
                name: 'test user',
                role: 's',
            })

            should.exist(response.body)
            const userId = response.body

            try {
                await classHours.charge(userId, 4)
            } catch (ex) {
                should.not.exist(ex)
            }

            const now = moment()

            const r = await booking.batchCreateBookingsRequest({
                user_id: userId,
                start_time: now.clone().add(50, 'h').set('minute', 0).set('second', 0),
                end_time: now.clone().add(50, 'h').set('minute', 30).set('second', 0),
            })

            r.body.length.should.gt(0)
            const batchId = r.body[0]

            batchId.should.gt(0)
        })
    })
})
