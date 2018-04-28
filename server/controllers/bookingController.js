const { UserNotFoundError } = require('../bll/user')
const { BalanceClassHourInSufficientError, EndTimeWithinHalfHourLaterOfStartTimeError, StartTimeWithin48HoursError } = require('../bll/booking')
const bookings = require('../bll/booking')

const env = process.env.NODE_ENV || 'test'
const config = require('../../knexfile')[env]
const knex = require('knex')(config)

const batchCreateBookings = async ctx => {
    try {
        ctx.body = await bookings.batchCreateBookingsFor(ctx.params.user_id, ctx.request.body)
    } catch (ex) {
        console.error(ex)

        if ((ex instanceof UserNotFoundError) || (ex instanceof BalanceClassHourInSufficientError) || (ex instanceof StartTimeWithin48HoursError) || (ex instanceof EndTimeWithinHalfHourLaterOfStartTimeError)) {
            ctx.throw(400, ex)
        } else {
            ctx.throw(500, ex)
        }
    }
}

const listBatchBookingsForSingleUser = async ctx => {
    try {
        ctx.body = await bookings.listBatchBookingsFor(ctx.params.user_id)
    } catch (ex) {
        console.error(ex)

        ctx.throw(500, ex)
    }
}

const listBatchBookingsForMultipleUsers = async ctx => {
    try {
        ctx.body = await bookings.listBatchBookings(ctx.query.users)
    } catch (ex) {
        console.error(ex)
        ctx.throw(500, ex)
    }
}

const listAllBookingsForMultipleUsers = async ctx => {
    try {
        ctx.body = await bookings.listAllBookings(ctx.query.users)
    } catch (ex) {
        console.error(ex)
        ctx.throw(500, ex)
    }
}

module.exports = {
    batchCreateBookings,
    listBatchBookingsForSingleUser,
    listBatchBookingsForMultipleUsers,
    listAllBookingsForMultipleUsers,
}
