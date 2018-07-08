const _ = require('lodash')
const env = process.env.NODE_ENV || 'test'
const config = require('../../knexfile')[env]
const knex = require('knex')(config)
const moment = require('moment-timezone')

function checkTimeConflicts(data) {
    for (let i = 0; i < data.length - 1; i++) {
        for (let j = i + 1; j < data.length; j++) {
            if (
                (data[i].start_time >= data[j].start_time
                    && data[i].start_time < data[j].end_time) ||
                (data[i].end_time > data[j].start_time
                    && data[i].end_time <= data[j].end_time)) {
                throw new Error('schedule conflicts!')
            }
        }
    }
}

const uniformTime = function (theStartTime, theEndTime) {
    let start_time = theStartTime
    if (start_time) {
        start_time = new Date(start_time)
    } else {
        start_time = new Date(0, 0, 0)
    }

    let end_time = theEndTime
    if (end_time) {
        end_time = new Date(end_time)
    } else {
        end_time = new Date(2999, 11, 30)
    }
    return { start_time, end_time }
}

const uniformTimes = function (data) {
    for (let i = 0; i < data.length; i++) {
        const u = uniformTime(data[i].start_time, data[i].end_time)
        data[i].start_time = u.start_time
        data[i].end_time = u.end_time
    }
}

const checkTimeRangeOverlapWithDBTime = async function (table, user_id, time, start_time, end_time) {
    const selected = await knex(table)
        .where('user_id', '=', user_id)
        .andWhere(time, time === 'start_time' ? '>=' : '>', start_time)
        .andWhere(time, time === 'start_time' ? '<' : '<=', end_time)
        .andWhere('status', '!=', 'cancelled')
        .select('user_id')

    if (selected.length > 0) {
        throw new Error(`Schedule ${time} conflicts!`)
    }
}

const checkTimeRangeOverlapWithDBStartTime = async function (table, user_id, start_time, end_time) {
    await checkTimeRangeOverlapWithDBTime(table, user_id, 'start_time', start_time, end_time)
}

const checkTimeRangeOverlapWithDBEndTime = async function (table, user_id, start_time, end_time) {
    await checkTimeRangeOverlapWithDBTime(table, user_id, 'end_time', start_time, end_time)
}

const checkTimeRangeOverlapWithDB = async function (table, user_id, start_time, end_time) {
    await checkTimeRangeOverlapWithDBStartTime(table, user_id, start_time, end_time)
    await checkTimeRangeOverlapWithDBEndTime(table, user_id, start_time, end_time)
}

const convertToDBFormat = function (time) {
    return new Date(time).toISOString().replace('T', ' ').replace('Z', ' ').substr(0, 19)
}

const checkDBTimeRangeOverlapWithTime = async function (table, user_id, time) {
    const selected = await knex(table)
        .where('user_id', '=', user_id)
        .andWhere('start_time', '<=', time)
        .andWhere('end_time', '>', time)
        .andWhere('status', '!=', 'cancelled')
        .select('user_id')

    if (selected.length > 0) {
        throw new Error(`Existing schedules conflict with ${time}!`)
    }
}

const checkDBTimeRangeOverlapWithTimeRange = async function (table, user_id, start_time, end_time) {
    start_time = convertToDBFormat(start_time)
    end_time = convertToDBFormat(end_time)

    await checkDBTimeRangeOverlapWithTime(table, user_id, end_time)
    await checkDBTimeRangeOverlapWithTime(table, user_id, start_time)
}

const tzShift = (dateTime, oldTz, newTz) => moment.tz(dateTime, oldTz).tz(newTz)

const zhStartEndTime = (start_time, end_time) => {
    moment.locale('zh-CN')
    return `${moment(start_time).format('YYYY年MM月DD日 ddd HH:mm')}-${moment(end_time).format('HH:mm')}`
}
const zhEndTime = end_time => {
    moment.locale('zh-CN')
    return moment(end_time).format('YYYY年MM月DD日 HH:mm')
}
const enStartTime = (start_time, time_zone) => {
    moment.locale('en-US')
    const oldTz = 'Asia/Shanghai'
    const newTz = time_zone || oldTz
    const timeMoment = moment(start_time)
    const timeLocalMoment = tzShift(timeMoment, oldTz, newTz)
    const timeLocal = timeLocalMoment.format('HH:mm DD/MMM/YYYY ddd')
    return `${timeLocal}, ${newTz}`
}

const zhFromNow = start_time => {
    moment.locale('zh-CN')
    const start = moment(start_time)
    const now = moment()
    const days = start.diff(now, 'd')
    const hours = start.diff(now, 'hours')
    const minutes = start.diff(now, 'm')
    if (hours === 0) {
        return `${minutes} 分钟后`
    } else if (days === 0) {
        return `${hours} 小时后`
    }
    return `${Math.ceil(start.diff(now, 'd', true))} 天后`
}
const enFromNow = start_time => {
    moment.locale('en-US')
    return moment(start_time).fromNow()
}

module.exports = {
    uniformTimes,
    checkTimeConflicts,
    async checkTimeConflictsWithDB(table, user_id, start_time, end_time) {
        await checkTimeRangeOverlapWithDB(table, user_id, start_time, end_time)
        await checkDBTimeRangeOverlapWithTimeRange(table, user_id, start_time, end_time)
    },
    uniformTime,
    convertToDBFormat,
    zhEndTime,
    zhStartEndTime,
    enStartTime,
    zhFromNow,
    enFromNow,
}
