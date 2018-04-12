const timeHelper = require('../common/time-helper')
const env = process.env.NODE_ENV || 'test'
const config = require('../../knexfile')[env]
const knex = require('knex')(config)

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
            knex.fn.now(),
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
        )
}

const listAll = async ctx => {
    ctx.body = await selectSchedules()
}

const list = async ctx => {
    try {
        const { start_time, end_time } = timeHelper.uniformTime(ctx.query.start_time, ctx.query.end_time)

        ctx.body = await selectCompanionWithMoreInfo()
            .where('companion_class_schedule.user_id', ctx.params.user_id)
            .andWhere('companion_class_schedule.start_time', '>=', start_time)
            .andWhere('companion_class_schedule.end_time', '<=', end_time)
    } catch (error) {
        console.error(error)
        ctx.throw(500, error)
    }
}

const create = async ctx => {
    const { body } = ctx.request
    const data = body.map(b => Object.assign({ user_id: ctx.params.user_id }, b))

    try {
        timeHelper.uniformTimes(data)
        console.log('inserting data1: ', data)
        timeHelper.checkTimeConflicts(data)
        console.log('inserting data2: ', data)
        for (let i = 0; i < data.length; i++) {
            /* eslint-disable */
            await timeHelper.checkTimeConflictsWithDB('companion_class_schedule', ctx.params.user_id, data[i].start_time, data[i].end_time)
            /* eslint-enable */
        }

        console.log('inserting data3: ', data)

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
        console.error(ex)
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
