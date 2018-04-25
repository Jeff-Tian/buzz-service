const { UserNotFoundError } = require('../bll/user')
const { BalanceClassHourInSufficientError } = require('../bll/booking')
const bookings = require('../bll/booking')

const env = process.env.NODE_ENV || 'test'
const config = require('../../knexfile')[env]
const knex = require('knex')(config)

const batchCreateBookings = async ctx => {
    try {
        ctx.body = await bookings.batchCreateBookingsFor(ctx.params.user_id, ctx.request.body)
    } catch (ex) {
        console.error(ex)

        if ((ex instanceof UserNotFoundError) || (ex instanceof BalanceClassHourInSufficientError)) {
            ctx.throw(400, ex)
        } else {
            ctx.throw(500, ex)
        }
    }
}

module.exports = { batchCreateBookings }
