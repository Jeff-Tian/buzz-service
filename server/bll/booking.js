const env = process.env.NODE_ENV || 'test'
const config = require('../../knexfile')[env]
const knex = require('knex')(config)

const _ = require('lodash')
const user = require('./user')

const moment = require('moment')
const uuidv4 = require('uuid/v4')

/*eslint-disable */
class StartTimeEarlierThanNowError extends Error {
    constructor(s, uuid) {
        super(`${s} <${uuid}>`)
        this.name = 'StartTimeEarlierThanNowError'
    }
}

class EndTimeWithinHalfHourLaterOfStartTimeError extends Error {
    constructor(s, uuid) {
        super(`${s} <${uuid}>`)
        this.name = 'EndTimeWithinHalfHourLaterOfStartTimeError'
    }
}

class BalanceClassHourInSufficientError extends Error {
    constructor(s, uuid) {
        super(`${s} <${uuid}>`)
        this.name = 'BalanceClassHourInSufficientError'
    }
}

/* eslint-enable */
module.exports = {
    StartTimeEarlierThanNowError,
    EndTimeWithinHalfHourLaterOfStartTimeError,
    BalanceClassHourInSufficientError,
    validateTimeSlot({ start_time, end_time }) {
        if (!start_time) {
            throw new Error('startTime is required', uuidv4())
        }

        if (!end_time) {
            throw new Error('endTime is required', uuidv4())
        }

        const startTime = moment(start_time)
        const endTime = moment(end_time)

        if (!startTime.isValid()) {
            throw new Error('invalid startTime', uuidv4())
        }

        if (!endTime.isValid()) {
            throw new Error('invalid endTime', uuidv4())
        }

        if (startTime.format('YYYY-MM-DD') !== endTime.format('YYYY-MM-DD')) {
            throw new Error('startTime and endTime should be on the same day', uuidv4())
        }

        if (['00', '30'].indexOf(startTime.format('mm')) < 0 || ['00', '30'].indexOf(endTime.format('mm')) < 0) {
            throw new Error(`startTime and endTime should be an hour or half hour, got ${startTime} - ${endTime}`, uuidv4())
        }

        if (moment().isAfter(startTime)) {
            throw new StartTimeEarlierThanNowError('startTime should be later than now', uuidv4())
        }

        if (startTime.add(0.5, 'h').isAfter(endTime)) {
            throw new EndTimeWithinHalfHourLaterOfStartTimeError('The endTime should be at least half hour later than the startTime')
        }
    },

    getBookingTable(role) {
        return {
            [user.MemberType.Student]: 'student_class_schedule',
            [user.MemberType.Companion]: 'companion_class_schedule',
        }[role]
    },

    async getBatchId(user_id, role) {
        return _.get(await knex(this.getBookingTable(role)).max('batch_id as max_batch_id').where({ user_id }).whereNotNull('batch_id'), '0.max_batch_id', 0) + 1
    },

    generateBookings(n, user_id, batch_id, start_time, end_time) {
        return _.times(n, i => ({
            user_id,
            batch_id,
            status: 'booking',
            start_time: moment(start_time).add(i, 'w').utc().format(),
            end_time: moment(end_time).add(i, 'w').utc().format(),
        }))
    },
    async batchCreateBookingsFor(userId, { start_time, end_time, n }) {
        if (!userId) {
            throw new Error('invalid userId', uuidv4())
        }

        this.validateTimeSlot({ start_time, end_time })

        const theUser = await user.get(userId)
        if (theUser.class_hours <= 0) {
            throw new BalanceClassHourInSufficientError(`balance class hours of ${userId} is only ${theUser.class_hours}`, uuidv4())
        }

        if (!n) {
            n = theUser.class_hours
        }

        if (n > theUser.class_hours) {
            throw new BalanceClassHourInSufficientError(`balance class hours of ${userId} is only ${theUser.class_hours}, trying to create ${n} bookings.`, uuidv4())
        }

        const batchId = await this.getBatchId(userId, theUser.role)
        const bookings = this.generateBookings(n, userId, batchId, start_time, end_time)

        await knex.batchInsert(this.getBookingTable(theUser.role), bookings).returning('batch_id')

        return { batchId, bookings }
    },

    async listBatchBookingsFor(user_id) {
        if (!user_id) {
            throw new Error('invalid user_id', uuidv4())
        }

        const theUser = await user.get(user_id)

        return await knex(this.getBookingTable(theUser.role))
            .select('batch_id', 'user_id', 'class_id', 'status', 'start_time', 'end_time')
            .whereNotNull('batch_id')
            .andWhere({ user_id })
    },

    async cancelBatchBookingFor(user_id, batch_id) {
        if (!user_id) {
            throw new Error('invalid user_id', uuidv4())
        }

        if (!batch_id) {
            throw new Error('invalid batch_id', uuidv4())
        }

        const theUser = await user.get(user_id)

        return await knex(this.getBookingTable(theUser.role))
            .where('user_id', '=', user_id)
            .andWhere('batch_id', '=', batch_id)
            .delete()
    },

    searchTempBookings(userIdArray) {
        function searchTempBookingsFrom(table) {
            let search = knex
                .select('batch_id', 'user_id', 'start_time', 'end_time', 'status')
                .from(table)
                .whereNull('batch_id')

            if (userIdArray instanceof Array) {
                search = search.andWhere('user_id', 'in', userIdArray)
            }

            return search
        }

        const search1 = searchTempBookingsFrom('student_class_schedule')
        const search2 = searchTempBookingsFrom('companion_class_schedule')

        return search1.unionAll(search2)
    },

    searchBatchBookings(userIdArray) {
        function searchBatchBookingsFrom(table) {
            const search = knex
                .select('batch_id', 'user_id', 'start_time', 'end_time', 'status')
                .from(table)
                .whereNotNull('batch_id')

            if (userIdArray instanceof Array) {
                search.andWhere('user_id', 'in', userIdArray)
            }

            return search
        }

        const search1 = searchBatchBookingsFrom('student_class_schedule')
        const search2 = searchBatchBookingsFrom('companion_class_schedule')

        return search1.unionAll(search2)
    },

    async listBatchBookings(userIdArray) {
        if (!(userIdArray instanceof Array)) {
            userIdArray = [userIdArray]
        }

        return (await this.searchBatchBookings(userIdArray))
    },

    async listAllBookings(userIdArray) {
        if (!(userIdArray instanceof Array)) {
            userIdArray = [userIdArray]
        }

        return await this.searchTempBookings(userIdArray).unionAll(this.searchBatchBookings(userIdArray))
    },
}
