const timeHelper = require('../../server/common/time-helper')
const chai = require('chai')
const should = chai.should()

describe('time helper', () => {
    it('should detect time conflicts', () => {
        (() => {
            timeHelper.checkTimeConflicts([
                {
                    start_time: new Date(2018, 4, 2, 18, 0, 0),
                    end_time: new Date(2018, 4, 2, 18, 30, 0),
                },
                {
                    start_time: new Date(2018, 4, 2, 18, 0, 0),
                    end_time: new Date(2018, 4, 2, 18, 30, 0),
                },
            ])
        }).should.throw(Error)
    })

    it('连续的时间段不算冲突', () => {
        (() => {
            timeHelper.checkTimeConflicts([
                {
                    start_time: new Date(2018, 4, 2, 18, 0, 0),
                    end_time: new Date(2018, 4, 2, 18, 30, 0),
                },
                {
                    start_time: new Date(2018, 4, 2, 18, 30, 0),
                    end_time: new Date(2018, 4, 2, 19, 0, 0),
                },
            ])
        }).should.not.throw(Error);

        (() => {
            timeHelper.checkTimeConflicts([
                {
                    start_time: new Date(2018, 4, 2, 18, 30, 0),
                    end_time: new Date(2018, 4, 2, 19, 0, 0),
                },
                {
                    start_time: new Date(2018, 4, 2, 18, 0, 0),
                    end_time: new Date(2018, 4, 2, 18, 30, 0),
                },
            ])
        }).should.not.throw(Error)
    })
})
