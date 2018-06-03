import logger from '../common/logger'

const _ = require('lodash')
const promisify = require('../common/promisify')
const env = process.env.NODE_ENV || 'test'
const config = require('../../knexfile')[env]
const knex = require('knex')(config)

const msgDal = require('../dal/msg')

const upsert = async ctx => {
    const { body } = ctx.request

    try {
        ctx.body = await msgDal.upsert(body)
    } catch (error) {
        logger.error(error)

        ctx.status = 500
        ctx.body = {
            error: 'Upsert failed!',
        }
    }
}

const query = async ctx => {
    let query = knex('msg')
    const qs = { deleted: 0, ...ctx.query }
    const { msg_id } = qs
    if (msg_id) {
        if (_.isArray(msg_id)) {
            query = query.whereIn('msg_id', msg_id)
        } else {
            query = query.where({ msg_id })
        }
    } else {
        _.each(['type', 'class_id', 'from_user_id', 'to_user_id', 'read', 'deleted'], i => {
            const v = qs[i]
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
        .leftJoin('classes', 'msg.class_id', 'classes.class_id')
        .leftJoin('users as from', 'msg.from_user_id', 'from.user_id')
        .leftJoin('users as to', 'msg.to_user_id', 'to.user_id')
        .leftJoin('user_profiles as from_profile', 'msg.from_user_id', 'from_profile.user_id')
        .leftJoin('user_profiles as to_profile', 'msg.to_user_id', 'to_profile.user_id')
        .select('msg.*', 'classes.topic as class_topic', 'from.name as from_name', 'to.name as to_name', 'from_profile.avatar as from_avatar', 'to_profile.avatar as to_avatar')
        .orderBy('msg_id', 'desc')
        .paginate(qs.per_page, qs.current_page)
}

const queryByToUser = async ctx => {
    const type = ctx.query.type
    delete ctx.query.type
    ctx.query.to_user_id = ctx.params.to_user_id
    if (type === 'advisor') {
        ctx.query.type = ['class_feedback']
    }
    await query(ctx)
}

module.exports = { upsert, query, queryByToUser }
