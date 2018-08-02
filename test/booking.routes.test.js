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
const createTestUserAndBookings = async function () {
    const createUserResponse = await user.createUserRequest({
        name: 'test user',
        role: 's',
    })

    should.exist(createUserResponse.body)
    const userId = createUserResponse.body

    try {
        await classHours.charge(userId, 4)
    } catch (ex) {
        should.not.exist(ex)
    }

    const now = moment()

    const bookingInfo = {
        user_id: userId,
        start_time: now.clone().add(50, 'h').set('minute', 0).set('second', 0).format(),
        end_time: now.clone().add(50, 'h').set('minute', 30).set('second', 0).format(),
    }

    const createBookingResponse = await booking.batchCreateBookingsRequest(bookingInfo)

    createBookingResponse.body.bookings.length.should.eql(4)

    const batchId = createBookingResponse.body.batchId

    batchId.should.gt(0)
    return { bookingInfo, batchId, userId }
}
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

    describe('booking 测试', () => {
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
                ex.response.text.should.include('User with id 100 not found')
            }
        })

        it('没有课时时不能创建需求', async () => {
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
                ex.response.text.should.include(`balance class hours of ${userId} is only null`)
            }
        })

        it('批量插入4条预约需求', async () => {
            const { userId, batchId, bookingInfo } = await createTestUserAndBookings()

            const getSingleUserBookingResponse = await booking.listBatchBookingsForSingleUserRequest(userId)
            getSingleUserBookingResponse.body.length.should.gt(0)

            const getMultipleUserBookingsResponse = await booking.listBatchBookingsForMultipleUserRequest([userId])
            getMultipleUserBookingsResponse.body.filter(b => Number(b.batch_id) === Number(batchId)).length.should.eql(4)
            getMultipleUserBookingsResponse.body[0].user_id.should.eql(userId)

            try {
                const createMoreBookingResponse = await booking.batchCreateBookingsRequest({
                    user_id: userId,
                    start_time: bookingInfo.start_time,
                    end_time: bookingInfo.end_time,
                    n: 100,
                })
            } catch (ex) {
                should.exist(ex)
                ex.status.should.eql(400)
                ex.response.text.should.include(`balance class hours of ${userId} is only 4, trying to create 100 bookings.`)
            }
        })

        it('同一时间的需求不能重复插入', async () => {
            const { bookingInfo } = await createTestUserAndBookings()

            try {
                const createSameBookingsAgainResponse = await booking.batchCreateBookingsRequest(bookingInfo)
            } catch (ex) {
                should.exist(ex)
                ex.status.should.eql(500)
            }
        })

        it('一个 batchId 可以返回多条记录', async () => {
            const { userId, batchId } = await createTestUserAndBookings()

            const getSingleUserBookingResponse = await booking.listBatchBookingsForSingleUserRequest(userId)
            getSingleUserBookingResponse.body.length.should.gt(0)
            getSingleUserBookingResponse.body.length.should.eql(4)

            const getMultipleUserBookingsResponse = await booking.listBatchBookingsForMultipleUserRequest([userId])
            getMultipleUserBookingsResponse.body[0].batch_id.should.eql(batchId)
            getMultipleUserBookingsResponse.body.filter(b => Number(b.batch_id) === Number(batchId)).length.should.eql(4)
            getMultipleUserBookingsResponse.body.filter(b => !b.batch_id).length.should.eql(0)

            const getMultipleUserAllBookingsResponse = await booking.listAllBookingsForMultipleUserRequest([userId])
            getMultipleUserAllBookingsResponse.body.length.should.gt(0)
            getMultipleUserAllBookingsResponse.body.filter(b => !b.batch_id).length.should.gt(0)
        })

        it('可以批量取消预约', async () => {
            const { userId, batchId } = await createTestUserAndBookings()

            try {
                const cancelBatchBookingRequest = await booking.cancelBatchBookingsForSingleUserRequest(userId, batchId)
            } catch (ex) {
                should.not.exist(ex)
            }

            const getMultipleUserBatchBookingsResponse = await booking.listBatchBookingsForMultipleUserRequest([userId])
            getMultipleUserBatchBookingsResponse.body.filter(b => Number(b.batch_id) === Number(batchId)).length.should.eql(0)
        })
    })
})
