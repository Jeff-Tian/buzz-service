import logger from '../common/logger'
import * as userBll from './user'
import { NeedChargeThreshold, UserTags } from '../common/constants'

const _ = require('lodash')
const env = process.env.NODE_ENV || 'test'
const knexConfig = require('../../knexfile')[env]
const knex = require('knex')(knexConfig)

const wechat = require('../common/wechat')

const countFrozenClassHours = async user_id => {
    const result = await knex('classes')
        .leftJoin('student_class_schedule', 'classes.class_id', 'student_class_schedule.class_id')
        .select('classes.status as class_status', 'classes.class_id as class_id', 'student_class_schedule.status as schedule_status')
        .countDistinct('classes.class_id as count')
        .where({ user_id, 'student_class_schedule.status': 'confirmed' })
        .whereIn('classes.status', ['opened', 'cancelled'])
    return _.get(result, '0.count')
}

const getAllClassHours = async user_id => {
    const balance = _.get(await knex('user_balance').select('class_hours').where({ user_id }), '0.class_hours')
    const frozenClassHours = await countFrozenClassHours(user_id)
    return _.toInteger(balance) + _.toInteger(frozenClassHours)
}

async function getCurrentClassHours(trx, user_id) {
    return await trx('user_balance')
        .select('class_hours')
        .where({ user_id })
}

async function consumeClassHours(trx, userId, classHours, remark = '') {
    if (!trx) {
        trx = knex
    }

    await trx('user_balance_history')
        .insert({
            user_id: userId,
            type: 'h',
            event: 'consume',
            amount: -classHours,
            remark,
        })
    const currentClassHours = await getCurrentClassHours(trx, userId)

    const balance = (currentClassHours.length > 0 ? currentClassHours[0].class_hours : 0) - Number(classHours)

    const newClassHours = {
        user_id: userId,
        class_hours: balance,
    }

    if (currentClassHours.length > 0) {
        await trx('user_balance')
            .where('user_id', userId)
            .update(newClassHours)
    } else {
        await trx('user_balance').insert(newClassHours)
    }

    logger.info('consumed for ', userId)

    const frozenClassHours = await countFrozenClassHours(userId)

    if (balance + frozenClassHours <= NeedChargeThreshold) {
        await userBll.tryAddTags(userId, [{ name: UserTags.NeedCharge, remark: '扣课时后课时不足自动添加此标签' }], trx)
    }
}

async function chargeClassHours(trx, userId, classHours, remark = '') {
    if (trx === null) {
        trx = knex
    }

    await trx('user_balance_history')
        .insert({
            user_id: userId,
            type: 'h',
            event: 'charge',
            amount: classHours,
            remark,
        })

    const currentClassHours = await getCurrentClassHours(trx, userId)

    const newClassHours = {
        user_id: userId,
        class_hours: Number(classHours) + (currentClassHours.length > 0 ? Number(currentClassHours[0].class_hours) : 0),
    }

    if (currentClassHours.length > 0) {
        await trx('user_balance')
            .where('user_id', userId)
            .update(newClassHours)
    } else {
        await trx('user_balance').insert(newClassHours)
    }

    await userBll.tryDeleteTags(userId, [UserTags.Leads], trx)

    if (newClassHours.class_hours <= NeedChargeThreshold) {
        await userBll.tryAddTags(userId, [{ name: UserTags.NeedCharge, remark: '充值后课时仍然不足自动添加此标签' }], trx)
    } else {
        await userBll.tryDeleteTags(userId, [UserTags.NeedCharge], trx)
    }
}

module.exports = {
    consume: consumeClassHours,
    charge: chargeClassHours,
    countBookedClasses: countFrozenClassHours,
    getAllClassHours,
}
