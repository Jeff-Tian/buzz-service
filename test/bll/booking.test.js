const moment = require('moment')
const booking = require('../../server/bll/booking')
const chai = require('chai')
const should = chai.should()
describe('booking tests', () => {
    it('should validate time slot', () => {
        should.throw(() => {
            booking.validateTimeSlot({
                end_time: new Date(),
            })
        })

        should.throw(() => {
            booking.validateTimeSlot({
                start_time: new Date(),
            })
        })

        should.throw(() => {
            booking.validateTimeSlot({
                start_time: 'xxx',
                end_time: new Date(),
            })
        })

        should.throw(() => {
            booking.validateTimeSlot({
                start_time: new Date(),
                end_time: 'yyy',
            })
        })

        should.throw(() => {
            booking.validateTimeSlot({
                start_time: new Date(1999, 1, 1),
                end_time: new Date(1998, 1, 1),
            })
        })

        should.throw(() => {
            booking.validateTimeSlot({
                start_time: new Date(2018, 3, 25, 12, 0, 0),
                end_time: new Date(2018, 3, 25, 12, 25, 0),
            })
        })

        const now = moment()
        should.throw(() => {
            booking.validateTimeSlot({
                start_time: new Date(2010, 1, 1),
                end_time: now.clone().add(12, 'h').set('minute', 30).set('second', 0),
            })
        }, booking.start_timeEarlierThanNowError)

        should.throw(() => {
            booking.validateTimeSlot({
                start_time: now.clone().add(50, 'h').set('minute', 0).set('second', 0),
                end_time: now.clone().add(50, 'h').set('minute', 0).set('second', 30),
            })
        }, booking.end_timeWithinHalfHourLaterOfstart_timeError)

        should.not.throw(() => {
            booking.validateTimeSlot({
                start_time: now.clone().add(50, 'h').set('minute', 0).set('second', 0),
                end_time: now.clone().add(50, 'h').set('minute', 30).set('second', 0),
            })
        })
    })
})
