import logger from '../common/logger'

const promisify = require('../common/promisify')
const env = process.env.NODE_ENV || 'test'
const config = require('../../knexfile')[env]
const knex = require('knex')(config)
const _ = require('lodash')

async function findOneById(trx, content_id) {
    return await trx('content').where({ content_id })[0]
}

const upsert = async ctx => {
    const { body } = ctx.request

    const trx = await promisify(knex.transaction)

    try {
        let content_id = body.content_id
        const current = await findOneById(trx, content_id)

        if (current) {
            logger.info(1)
            await trx('content')
                .update(body)
                .where('content_id', content_id)
        } else {
            logger.info(2)
            delete body.content_id
            const result = await trx('content').insert(body)
            content_id = _.get(result, 0)
        }

        await trx.commit()

        ctx.body = { content_id }
    } catch (error) {
        console.error(error)

        await trx.rollback()
        ctx.status = 500
        ctx.body = {
            error: 'Upsert failed!',
        }
    }
}

const query = async ctx => {
    let query = knex('content')
    const { content_id } = ctx.query
    if (content_id) {
        if (_.isArray(content_id)) {
            query = query.whereIn('content_id', content_id)
        } else {
            query = query.where({ content_id })
        }
    } else {
        _.each(['module', 'topic', 'level', 'buzz_level'], i => {
            const v = ctx.query[i]
            if (v) {
                if (_.isArray(v)) {
                    query = query.whereIn(i, v)
                } else {
                    query = query.where(i, v)
                }
            }
        })
    }
    ctx.body = await query
}
const topic = async ctx => {
    ctx.body = await knex('content')
        .distinct('topic')
        .pluck('topic')
}

module.exports = { upsert, query, topic }
