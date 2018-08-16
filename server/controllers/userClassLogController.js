import logger from '../common/logger'

const promisify = require('../common/promisify')
const env = process.env.NODE_ENV || 'test'
const config = require('../../knexfile')[env]
const knex = require('knex')(config)
const _ = require('lodash')

const userClassLogDal = require('../dal/userClassLog')

const upsert = async ctx => {
    const { body } = ctx.request
    ctx.body = await userClassLogDal.upsert(body)
}

const queryFn = ctx => {
    let query = knex('user_class_log')
        .leftJoin('classes', 'user_class_log.class_id', 'classes.class_id')
        .leftJoin('users', 'user_class_log.user_id', 'users.user_id')
        .leftJoin('user_profiles', 'user_class_log.user_id', 'user_profiles.user_id')
    const { user_class_log_id } = ctx.query
    if (user_class_log_id) {
        if (_.isArray(user_class_log_id)) {
            query = query.whereIn('user_class_log_id', user_class_log_id)
        } else {
            query = query.where({ user_class_log_id })
        }
    } else {
        _.each(['class_id', 'user_id', 'type'], i => {
            const v = ctx.query[i]
            if (v) {
                if (_.isArray(v)) {
                    query = query.whereIn(`user_class_log.${i}`, v)
                } else {
                    query = query.where(`user_class_log.${i}`, v)
                }
            }
        })
    }
    query = query.orderBy('created_at', 'desc').paginate(ctx.query.per_page, ctx.query.current_page)
    return query
}
const query = async ctx => {
    const query = queryFn(ctx)
    ctx.body = await query
}

module.exports = { upsert, query }
