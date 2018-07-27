import logger from '../common/logger'

const timeHelper = require('../common/time-helper')
const env = process.env.NODE_ENV || 'test'
const config = require('../../knexfile')[env]
const knex = require('knex')(config)
const moment = require('moment-timezone')
const _ = require('lodash')

const selectSchedules = function () {
    return knex('student_class_schedule')
        .select('batch_id', 'user_id', 'class_id', 'status', 'start_time', 'end_time')
}

const selectSchedulesWithMoreInfo = function (studentId) {
    return knex('student_class_schedule')
        .leftJoin('classes', 'student_class_schedule.class_id', 'classes.class_id')

        .leftJoin('companion_class_schedule', 'student_class_schedule.class_id', 'companion_class_schedule.class_id')
        .leftJoin('user_profiles', 'companion_class_schedule.user_id', 'user_profiles.user_id')
        .leftJoin('users', 'companion_class_schedule.user_id', 'users.user_id')

        .leftJoin('class_feedback', function () {
            this.on(function () {
                this.on('class_feedback.class_id', 'student_class_schedule.class_id')
                this.andOn('class_feedback.to_user_id', 'user_profiles.user_id')
                this.andOn('class_feedback.from_user_id', 'student_class_schedule.user_id')
            })
        })
        .groupBy('classes.class_id')
        .select(
            'student_class_schedule.user_id as user_id',
            'student_class_schedule.class_id as class_id',
            'student_class_schedule.status as status',
            'student_class_schedule.start_time as start_time',
            'student_class_schedule.end_time as end_time',
            'classes.start_time as class_start_time',
            'classes.end_time as class_end_time',
            'classes.status as classes_status',
            'classes.topic as topic',
            'classes.name as title',

            knex.raw('group_concat(users.name) as companion_name'),
            knex.raw('group_concat(user_profiles.user_id) as companion_id'),
            knex.raw('group_concat(user_profiles.avatar) as companion_avatar'),
            knex.raw('group_concat(user_profiles.country) as companion_country'),

            'class_feedback.from_user_id as from_user_id',
            'class_feedback.to_user_id as to_user_id',
            'class_feedback.score as score',
            'class_feedback.comment as comment',
        )
}
const list = async ctx => {
    try {
        const { start_time, end_time } = timeHelper.uniformTime(ctx.query.start_time, ctx.query.end_time)

        let search = selectSchedulesWithMoreInfo()

        if (process.env.NODE_ENV !== 'test') {
            search = search.select(knex.raw('UTC_TIMESTAMP as "CURRENT_TIMESTAMP"'))
        } else {
            search = search.select(knex.fn.now())
        }

        search = search
            .where('student_class_schedule.user_id', ctx.params.user_id)
            .andWhere('student_class_schedule.start_time', '>=', timeHelper.convertToDBFormat(start_time))
            .andWhere('student_class_schedule.end_time', '<=', timeHelper.convertToDBFormat(end_time))
            .andWhere('classes.status', 'not in', ['cancelled'])
        let result = await search
        if (!_.isArray(result)) result = []
        const status = _.find(result, i => i.classes_status === 'ended') ? 'ended' : 'confirmed'
        const minClass = _.chain(result)
            .minBy('class_start_time')
            .value()
        const CURRENT_TIMESTAMP = moment().utc().format()
        const startTime = status === 'confirmed' ? moment().hour(10).minute(0).second(0).millisecond(0).utc().format() : moment(_.get(minClass, 'class_start_time')).subtract(1, 'd').hour(10).minute(0).second(0).millisecond(0).utc().format()
        const endTime = status === 'confirmed' ? moment().hour(22).minute(0).second(0).millisecond(0).utc().format() : moment(_.get(minClass, 'class_end_time')).subtract(1, 'd').hour(22).minute(0).second(0).millisecond(0).utc().format()
        result.push({
            CURRENT_TIMESTAMP: moment().utc().format(),
            class_end_time: endTime,
            end_time: endTime,
            start_time: startTime,
            class_start_time: startTime,
            classes_status: status,
            status,
            class_id: 'rookie',
            comment: null,
            companion_avatar: 'https://buzz-corner.user.resource.buzzbuzzenglish.com/rookie_buzzbuzz.png',
            companion_country: 'china',
            companion_id: 'BuzzBuzz',
            companion_name: 'BuzzBuzz',
            from_user_id: null,
            score: null,
            title: '入门指导课',
            to_user_id: null,
            topic_level: 'Basic',
            topic: '入门指导课',
            module: 'School',
            user_id: ctx.params.user_id,
            room_url: 'https://zoom.us/j/2019579072',
            zc: 0,
            evaluate_disabled: true,
            notification_disabled: true,
        })
        ctx.body = result
    } catch (error) {
        logger.error(error)
        ctx.throw(500, error)
    }
}

const listAll = async ctx => {
    ctx.body = await selectSchedules()
}

const create = async ctx => {
    const { body } = ctx.request
    const data = body.map(b => Object.assign({ user_id: ctx.params.user_id }, b))

    try {
        timeHelper.uniformTimes(data)
        timeHelper.checkTimeConflicts(data)

        data.map(d => {
            d.start_time = timeHelper.convertToDBFormat(d.start_time)
            d.end_time = timeHelper.convertToDBFormat(d.end_time)

            return d
        })
        for (let i = 0; i < data.length; i++) {
            /* eslint-disable */
            await timeHelper.checkTimeConflictsWithDB('student_class_schedule', ctx.params.user_id, data[i].start_time, data[i].end_time)
            /* eslint-enable */
        }

        const inserted = await knex('student_class_schedule')
            .returning('start_time')
            .insert(data)

        ctx.status = 201
        ctx.set('Location', `${ctx.request.URL}/${ctx.params.user_id}`)
        ctx.body = inserted
    } catch (ex) {
        console.error(ex)
        ctx.throw(409, ex)
    }
}

const cancel = async ctx => {
    try {
        const { body } = ctx.request
        const startTime = timeHelper.convertToDBFormat(body.start_time)

        const filter = {
            user_id: ctx.params.user_id,
            start_time: startTime,
        }

        const res = await knex('student_class_schedule').where(filter).andWhere({ status: 'booking' }).update({
            status: 'cancelled',
        })

        if (res > 0) {
            ctx.body = (await knex('student_class_schedule')
                .where(filter)
                .select('user_id', 'status'))[0]
        } else if (res === 0) {
            throw new Error(`trying to cancel a non-exist event @ ${startTime}`)
        } else {
            throw new Error(res)
        }
    } catch (ex) {
        console.error(ex)
        ctx.throw(500, ex)
    }
}

const batchList = async ctx => {
    const user_id = ctx.params.user_id
    const schedules = await selectSchedules().where({ user_id }).whereNotNull('batch_id').groupBy('batch_id')
    ctx.body = schedules
}

module.exports = { list, create, cancel, listAll, batchList }
