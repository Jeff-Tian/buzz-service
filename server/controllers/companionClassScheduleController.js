import logger from '../common/logger'

const timeHelper = require('../common/time-helper')
const env = process.env.NODE_ENV || 'test'
const config = require('../../knexfile')[env]
const knex = require('knex')(config)
const moment = require('moment-timezone')
const _ = require('lodash')

const selectSchedules = function () {
    return knex('companion_class_schedule')
        .select('user_id', 'class_id', 'status', 'start_time', 'end_time')
}

const selectCompanionWithMoreInfo = function () {
    return knex('companion_class_schedule')
        .leftJoin('classes', 'companion_class_schedule.class_id', 'classes.class_id')
        .leftJoin('user_profiles', 'companion_class_schedule.user_id', 'user_profiles.user_id')
        .leftJoin('users', 'companion_class_schedule.user_id', 'users.user_id')
        .select(
            'companion_class_schedule.class_id as class_id',
            'classes.status AS classes_status',
            'classes.end_time AS class_end_time',
            'classes.start_time AS class_start_time',
            'classes.topic AS topic',
            'companion_class_schedule.user_id AS companion_id',
            'companion_class_schedule.status AS status',
            'companion_class_schedule.start_time AS start_time',
            'companion_class_schedule.end_time AS end_time',
            'users.name AS companion_name',
            'user_profiles.avatar AS companion_avatar',
            'companion_class_schedule.user_id AS user_id',
            'companion_class_schedule.batch_id as batch_id',
            'user_profiles.country as companion_country'
        )
}

const listAll = async ctx => {
    ctx.body = await selectSchedules()
}

const list = async ctx => {
    try {
        let { start_time, end_time } = timeHelper.uniformTime(ctx.query.start_time, ctx.query.end_time)
        start_time = timeHelper.convertToDBFormat(start_time)
        end_time = timeHelper.convertToDBFormat(end_time)
        let search = selectCompanionWithMoreInfo()
        if (process.env.NODE_ENV !== 'test') {
            search = search
                .select(knex.raw('UTC_TIMESTAMP as "CURRENT_TIMESTAMP"'))
        } else {
            search = search
                .select(knex.fn.now())
        }

        search = search
            .whereNotIn('classes.status', ['cancelled'])
            .andWhere('companion_class_schedule.user_id', ctx.params.user_id)
            .andWhere('companion_class_schedule.start_time', '>=', start_time)
            .andWhere('companion_class_schedule.end_time', '<=', end_time)

        let result = await search
        if (!_.isArray(result)) result = []
        const minClass = _.chain(result)
            .minBy('class_end_time')
            .value()
        const status = moment().isSameOrAfter(moment(_.get(minClass, 'class_end_time')).add(48, 'h')) ? 'ended' : 'confirmed'
        const startTime = minClass ? moment(_.get(minClass, 'class_end_time')).utc().format() : moment().hour(0).minute(0).second(0).millisecond(0).utc().format()
        const endTime = minClass ? moment(_.get(minClass, 'class_end_time')).add(48, 'h').utc().format() : moment().hour(23).minute(59).second(0).millisecond(0).utc().format()
        const CURRENT_TIMESTAMP = moment().utc().format()
        result.push({
            CURRENT_TIMESTAMP: moment().utc().format(),
            class_end_time: endTime,
            end_time: endTime,
            start_time: startTime,
            class_start_time: startTime,
            classes_status: status,
            status,
            class_id: 'observation',
            comment: null,
            companion_avatar: 'https://buzz-corner.user.resource.buzzbuzzenglish.com/rookie_buzzbuzz.png',
            companion_country: 'china',
            companion_id: 'BuzzBuzz',
            companion_name: 'BuzzBuzz',
            from_user_id: null,
            score: null,
            title: 'Observation',
            to_user_id: null,
            topic_level: 'Basic',
            topic: 'Observation',
            module: 'School',
            user_id: ctx.params.user_id,
        })
        ctx.body = result
    } catch (error) {
        logger.error(error)
        ctx.throw(500, error)
    }
}

const create = async ctx => {
    const { body } = ctx.request
    const data = body.map(b => Object.assign({ user_id: ctx.params.user_id }, b))

    try {
        timeHelper.uniformTimes(data)
        timeHelper.checkTimeConflicts(data)
        for (let i = 0; i < data.length; i++) {
            /* eslint-disable */
            await timeHelper.checkTimeConflictsWithDB('companion_class_schedule', ctx.params.user_id, data[i].start_time, data[i].end_time)
            /* eslint-enable */
        }

        if (process.env.NODE_ENV !== 'test') {
            data.map(d => {
                d.start_time = timeHelper.convertToDBFormat(d.start_time)
                d.end_time = timeHelper.convertToDBFormat(d.end_time)

                return d
            })
        }

        const inserted = await knex('companion_class_schedule')
            .returning('start_time')
            .insert(data)

        ctx.status = 201
        ctx.set('Location', `${ctx.request.URL}/${ctx.params.user_id}`)
        ctx.body = inserted
    } catch (ex) {
        logger.error(ex)
        ctx.throw(409, ex)
    }
}

const cancel = async ctx => {
    try {
        const { body } = ctx.request
        const filter = {
            user_id: ctx.params.user_id,
            start_time: timeHelper.convertToDBFormat(body.start_time),
        }

        const res = await knex('companion_class_schedule').where(filter).update({
            status: 'cancelled',
        })

        if (res === 1) {
            ctx.body = (await knex('companion_class_schedule')
                .where(filter)
                .select('user_id', 'status'))[0]
        } else {
            throw new Error(`trying to cancel a non-exist event @ ${JSON.stringify(filter)}`)
        }
    } catch (ex) {
        console.error(ex)
        ctx.throw(500, ex)
    }
}

module.exports = { listAll, list, create, cancel }
