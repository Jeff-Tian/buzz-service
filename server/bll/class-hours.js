import * as userBll from './user'
import { NeedChargeThreshold, UserTags } from '../common/constants'

const _ = require('lodash')
const env = process.env.NODE_ENV || 'test'
const knexConfig = require('../../knexfile')[env]
const knex = require('knex')(knexConfig)

const countFrozenClassHours = async (user_id, trx = knex) => {
    const result = await trx('classes')
        .leftJoin('student_class_schedule', 'classes.class_id', 'student_class_schedule.class_id')
        .select('classes.status as class_status', 'classes.class_id as class_id', 'student_class_schedule.status as schedule_status')
        .sum('classes.class_hours as count')
        .where({ user_id, 'student_class_schedule.status': 'confirmed' })
        .whereIn('classes.status', ['opened', 'cancelled'])
    return _.get(result, '0.count')
}

const getAllClassHours = async (user_id, trx = knex) => {
    const balance = _.get(await trx('user_balance').select('class_hours').where({ user_id }), '0.class_hours')
    const frozenClassHours = await countFrozenClassHours(user_id, trx)
    return _.toNumber(balance) + _.toNumber(frozenClassHours)
}

async function getCurrentClassHours(trx, user_id) {
    return await trx('user_balance')
        .select('class_hours')
        .where({ user_id })
}

async function consumeClassHours(trx, userId, classHoursOrObj, remark = '') {
    if (!trx) {
        trx = knex
    }

    let classHours = _.get(classHoursOrObj, 'class_hours')
    if (_.isNil(classHours)) {
        classHours = classHoursOrObj
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

    const frozenClassHours = await countFrozenClassHours(userId, trx)

    if (balance + frozenClassHours <= NeedChargeThreshold) {
        await userBll.tryAddTags(userId, [{
            name: UserTags.NeedCharge,
            remark: '扣课时后课时不足自动添加此标签',
        }], trx)
    }
}

async function chargeClassHours(trx, userId, classHoursOrObj, remark = '') {
    if (trx === null) {
        trx = knex
    }

    let classHours = _.get(classHoursOrObj, 'class_hours')
    if (_.isNil(classHours)) {
        classHours = classHoursOrObj
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

    const allClassHours = await getAllClassHours(userId, trx)
    if (allClassHours <= NeedChargeThreshold) {
        await userBll.tryAddTags(userId, [{
            name: UserTags.NeedCharge,
            remark: '充值后课时仍然不足自动添加此标签',
        }], trx)
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
