import logger from '../common/logger'

const promisify = require('../common/promisify')
const env = process.env.NODE_ENV || 'test'
const config = require('../../knexfile')[env]
const knex = require('knex')(config)
const _ = require('lodash')

async function findOneById(faq_id) {
    return faq_id ? _.get(await knex('faq').where({ faq_id }), 0) : faq_id
}

const upsert = async ctx => {
    const { body } = ctx.request
    const trx = await promisify(knex.transaction)

    try {
        let faq_id = body.faq_id
        const current = await findOneById(faq_id)

        if (current) {
            await trx('faq')
                .update(body)
                .where('faq_id', faq_id)
        } else {
            delete body.faq_id
            const result = await trx('faq').insert(body)
            faq_id = _.get(result, 0)
        }

        await trx.commit()

        ctx.body = await findOneById(faq_id)
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
    let query = knex('faq')
    const { faq_id } = ctx.query
    if (faq_id) {
        if (_.isArray(faq_id)) {
            query = query.whereIn('faq_id', faq_id)
        } else {
            query = query.where({ faq_id })
        }
    } else {
        _.each(['type'], i => {
            const v = ctx.query[i]
            if (v) {
                if (_.isArray(v)) {
                    query = query.whereIn(i, v)
                } else {
                    query = query.where(i, v)
                }
            }
        })
        _.each(['sub_title', 'title'], i => {
            const v = ctx.query[i]
            if (v) {
                query = query.andWhere(i, 'like', `%${v}%`)
            }
        })
    }
    query = query.orderBy('faq_id', 'DESC').paginate(ctx.query.per_page, ctx.query.current_page)
    return query
}
const query = async ctx => {
    const query = queryFn(ctx)
    ctx.body = await query
}

const getRelated = async data => {
    if (!_.includes([1, true], _.get(data, 'show_related'))) return data
    const related_ids = _.chain(data)
        .get('related_ids')
        .split(',')
        .map(i => _.trim(i))
        .filter(i => !_.isInteger(i))
        .map(i => _.toInteger(i))
        .value()
    if (_.isEmpty(related_ids)) return data
    data.related_faqs = _.sortBy(await knex('faq').select('faq_id', 'title', 'sub_title').whereIn('faq_id', related_ids).whereNotIn('public', [0, false]), i => _.findIndex(related_ids, j => j === i.faq_id))
    return data
}

const getById = async ctx => {
    ctx.body = await getRelated(await findOneById(ctx.params.id))
}

const getOneByType = async ctx => {
    const query = queryFn(ctx).whereNotIn('public', [0, false])
    return await getRelated(_.head(await query) || {})
}
const student_index = async ctx => {
    ctx.body = await getOneByType({ query: { type: 'student_index' } })
}
const companion_index = async ctx => {
    ctx.body = await getOneByType({ query: { type: 'companion_index' } })
}

module.exports = { upsert, query, student_index, companion_index, getById }
