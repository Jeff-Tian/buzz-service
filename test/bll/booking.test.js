const moment = require('moment')
const booking = require('../../server/bll/booking')
const chai = require('chai')
const should = chai.should()
describe('booking tests', () => {
    it('should validate time slot', () => {
        should.throw(() => {
            booking.validateTimeSlot({
                endTime: new Date(),
            })
        })

        should.throw(() => {
            booking.validateTimeSlot({
                startTime: new Date(),
            })
        })

        should.throw(() => {
            booking.validateTimeSlot({
                startTime: 'xxx',
                endTime: new Date(),
            })
        })

        should.throw(() => {
            booking.validateTimeSlot({
                startTime: new Date(),
                endTime: 'yyy',
            })
        })

        should.throw(() => {
            booking.validateTimeSlot({
                startTime: new Date(1999, 1, 1),
                endTime: new Date(1998, 1, 1),
            })
        })

        should.throw(() => {
            booking.validateTimeSlot({
                startTime: new Date(2018, 3, 25, 12, 0, 0),
                endTime: new Date(2018, 3, 25, 12, 25, 0),
            })
        })

        const now = moment()
        should.throw(() => {
            booking.validateTimeSlot({
                startTime: now.clone().add(12, 'h').set('minute', 0).set('second', 0),
                endTime: now.clone().add(12, 'h').set('minute', 30).set('second', 0),
            })
        }, booking.StartTimeWithin48HoursError)

        should.throw(() => {
            booking.validateTimeSlot({
                startTime: now.clone().add(50, 'h').set('minute', 0).set('second', 0),
                endTime: now.clone().add(50, 'h').set('minute', 0).set('second', 30),
            })
        }, booking.EndTimeWithinHalfHourLaterOfStartTimeError)

        should.not.throw(() => {
            booking.validateTimeSlot({
                startTime: now.clone().add(50, 'h').set('minute', 0).set('second', 0),
                endTime: now.clone().add(50, 'h').set('minute', 30).set('second', 0),
            })
        })
    })
})
