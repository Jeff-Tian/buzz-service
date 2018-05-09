import moment from 'moment'
import * as user from '../test-helpers/user'
import * as userBll from '../../server/bll/user'
import * as booking from '../test-helpers/bookings'
import * as classHours from '../test-helpers/class-hour'

const { server, should, chai, knex } = require('../test-helpers/prepare')

const createTestUserAndBookings = async function () {
    const createUserResponse = await user.createUserRequest({
        name: 'test user',
        role: userBll.MemberType.Student,
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

module.exports = {
    createTestUserAndBookings,
}
