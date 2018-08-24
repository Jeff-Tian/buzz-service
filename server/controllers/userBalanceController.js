import logger from '../common/logger'
import BalanceHistoryBll from '../bll/balance-history'

const promisify = require('../common/promisify')
const wechat = require('../common/wechat')
const env = process.env.NODE_ENV || 'test'
const config = require('../../knexfile')[env]
const knex = require('knex')(config)
const classHoursBll = require('../bll/class-hours')
const integralBll = require('../bll/integral')
const chargeClassHour = async ctx => {
    const { body } = ctx.request

    const classHours = Number(body.class_hours)
    if (Number.isNaN(classHours) || classHours <= 0) {
        ctx.throw(400, 'class_hours should be a positive number!')
    }

    const trx = await promisify(knex.transaction)

    try {
        const userId = ctx.params.user_id
        await classHoursBll.charge(trx, userId, classHours, body.remark, ctx.state.user.user_id)

        await trx.commit()
        await wechat.chargeClassHours(userId, classHours, body.remark).catch(e => {
            logger.error('wechat chargeClassHours error', e)
        })
        ctx.status = 201
        ctx.set('Location', `${ctx.request.URL}`)
        ctx.body = (await knex('user_balance').select('class_hours').where({ user_id: userId }))[0]
    } catch (error) {
        console.error(error)

        await trx.rollback()
        ctx.status = 500
        ctx.body = {
            error: 'Charge failed!',
        }
    }
}

const consumeClassHour = async ctx => {
    const { body } = ctx.request

    const classHours = Number(body.class_hours)
    if (Number.isNaN(classHours) || classHours <= 0) {
        ctx.throw(400, 'class_hours should be a positive number!')
    }

    const trx = await promisify(knex.transaction)

    try {
        const userId = ctx.params.user_id
        await classHoursBll.consume(trx, userId, classHours, body.remark, ctx.state.user.user_id)
        await trx.commit()

        ctx.status = 201
        ctx.set('Location', `${ctx.request.URL}`)
        ctx.body = (await knex('user_balance').select('class_hours').where({ user_id: userId }))[0]
    } catch (error) {
        await trx.rollback()
        ctx.status = 500
        ctx.body = { error: 'Consume failed!' }
    }
}

const consumeIntegral = async ctx => {
    const { body } = ctx.request

    const integral = Number(body.integral)
    if (Number.isNaN(integral) || integral <= 0) {
        ctx.throw(400, 'integer should be a positive number!')
    }

    const trx = await promisify(knex.transaction)

    try {
        const userId = ctx.params.user_id
        await integralBll.consume(trx, userId, integral, body.remark, ctx.state.user.user_id)
        await trx.commit()

        ctx.status = 201
        ctx.set('Location', `${ctx.request.URL}`)
        ctx.body = (await knex('user_balance').select('integral').where({ user_id: userId }))[0]
    } catch (error) {
        logger.error(error)

        await trx.rollback()
        ctx.status = 500
        ctx.body = { error: 'Consume failed!' }
    }
}

const chargeIntegral = async ctx => {
    const { body } = ctx.request

    const integral = Number(body.integral)
    if (Number.isNaN(integral) || integral <= 0) {
        ctx.throw(400, 'integral should be a positive number!')
    }

    const trx = await promisify(knex.transaction)

    try {
        const userId = ctx.params.user_id
        await integralBll.charge(trx, userId, integral, body.remark, ctx.state.user.user_id)

        await trx.commit()

        ctx.status = 201
        ctx.set('Location', `${ctx.request.URL}`)
        ctx.body = (await knex('user_balance').select('integral').where({ user_id: userId }))[0]
    } catch (error) {
        logger.error(error)

        await trx.rollback()
        ctx.status = 500
        ctx.body = {
            error: 'Charge failed!',
        }
    }
}

const get = async ctx => {
    ctx.body = await BalanceHistoryBll.getHistoryByTypeUserId(ctx.params.type, ctx.params.user_id, ctx.query.pageSize, ctx.query.currentPage)
}

module.exports = {
    chargeClassHour,
    consumeClassHour,
    chargeIntegral,
    consumeIntegral,
    get,
}
