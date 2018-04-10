const timeHelper = require('../common/time-helper')
const env = process.env.NODE_ENV || 'test'
const config = require('../../knexfile')[env]
const knex = require('knex')(config)

const selectSchedules = function () {
    return knex('companion_class_schedule')
        .select('user_id', 'class_id', 'status', 'start_time', 'end_time')
}
const listAll = async ctx => {
    ctx.body = await selectSchedules()
}

const list = async ctx => {
    try {
        const { start_time, end_time } = timeHelper.uniformTime(ctx.query.start_time, ctx.query.end_time)

        ctx.body = await selectSchedules()
            .where('user_id', ctx.params.user_id)
            .andWhere('start_time', '>=', start_time)
            .andWhere('end_time', '<=', end_time)
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
        timeHelper.checkTimeConflicts(data)
        for (let i = 0; i < data.length; i++) {
            /* eslint-disable */
            await timeHelper.checkTimeConflictsWithDB('companion_class_schedule', ctx.params.user_id, data[i].start_time, data[i].end_time)
            /* eslint-enable */
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
            start_time: new Date(body.start_time).getTime(),
        }

        const res = await knex('companion_class_schedule').where(filter).update({
            status: 'cancelled',
        })

        if (res === 1) {
            ctx.body = (await knex('companion_class_schedule')
                .where(filter)
                .select('user_id', 'status'))[0]
        } else {
            throw new Error(res)
        }
    } catch (ex) {
        console.error(ex)
        ctx.throw(500, ex)
    }
}

module.exports = { listAll, list, create, cancel }
