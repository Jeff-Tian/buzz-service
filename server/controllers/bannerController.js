import logger from '../common/logger'

const promisify = require('../common/promisify')
const env = process.env.NODE_ENV || 'test'
const config = require('../../knexfile')[env]
const knex = require('knex')(config)
const _ = require('lodash')
const timeHelper = require('../common/time-helper')

async function findOneById(banner_id) {
    return banner_id ? _.get(await knex('banner').where({ banner_id }), 0) : banner_id
}

const upsert = async ctx => {
    const { body } = ctx.request
    if (body.start_at) {
        body.start_at = timeHelper.convertToDBFormat(body.start_at)
    }
    if (body.end_at) {
        body.end_at = timeHelper.convertToDBFormat(body.end_at)
    }

    const trx = await promisify(knex.transaction)

    try {
        let banner_id = body.banner_id
        const current = await findOneById(banner_id)

        if (current) {
            await trx('banner')
                .update(body)
                .where('banner_id', banner_id)
        } else {
            delete body.banner_id
            const result = await trx('banner').insert(body)
            banner_id = _.get(result, 0)
        }

        await trx.commit()

        ctx.body = await findOneById(banner_id)
    } catch (error) {
        logger.error(error)

        await trx.rollback()
        ctx.status = 500
        ctx.body = {
            error: 'Upsert failed!',
        }
    }
}

const queryFn = ctx => {
    let query = knex('banner')
    const { banner_id } = ctx.query
    if (banner_id) {
        if (_.isArray(banner_id)) {
            query = query.whereIn('banner_id', banner_id)
        } else {
            query = query.where({ banner_id })
        }
    } else {
        _.each(['position'], i => {
            const v = ctx.query[i]
            if (v) {
                if (_.isArray(v)) {
                    query = query.whereIn(i, v)
                } else {
                    query = query.where(i, v)
                }
            }
        })
        _.each(['name', 'title'], i => {
            const v = ctx.query[i]
            if (v) {
                query = query.andWhere(i, 'like', `%${v}%`)
            }
        })
    }
    query = query.orderBy('start_at', 'desc').paginate(ctx.query.per_page, ctx.query.current_page)
    return query
}
const query = async ctx => {
    const query = queryFn(ctx)
    ctx.body = await query
}
const getById = async ctx => {
    ctx.body = await findOneById(ctx.params.id)
}

const getByUserRole = async ctx => {
    const query = queryFn(ctx).whereNotIn('public', [0, false])
        .where('start_at', '<=', knex.fn.now())
        .where('end_at', '>=', knex.fn.now())
    ctx.body = await query
}

module.exports = { upsert, query, getByUserRole, getById }
