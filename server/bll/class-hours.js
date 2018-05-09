import logger from '../common/logger'

const _ = require('lodash')
const env = process.env.NODE_ENV || 'test'
const knexConfig = require('../../knexfile')[env]
const knex = require('knex')(knexConfig)

const wechat = require('../common/wechat')

const countBookedClasses = async user_id => {
    const result = await knex('classes')
        .leftJoin('student_class_schedule', 'classes.class_id', 'student_class_schedule.class_id')
        .select('classes.status as class_status', 'classes.class_id as class_id', 'student_class_schedule.status as schedule_status')
        .countDistinct('classes.class_id as count')
        .where({ user_id, 'student_class_schedule.status': 'confirmed' })
        .whereIn('classes.status', ['opened'])
    return _.get(result, '0.count')
}

async function getCurrentClassHours(trx, user_id) {
    return await trx('user_balance')
        .select('class_hours')
        .where({ user_id })
}

async function consumeClassHours(trx, userId, classHours, remark = '') {
    await trx('user_balance_history')
        .insert({
            user_id: userId,
            type: 'h',
            event: 'consume',
            amount: -classHours,
            remark,
        })
    const currentClassHours = await getCurrentClassHours(trx, userId)

    const new_class_hours = (currentClassHours.length > 0 ? currentClassHours[0].class_hours : 0) - Number(classHours)

    const booked_class_hours = await countBookedClasses(userId)
    const all_class_hours = _.toInteger(new_class_hours) + _.toInteger(booked_class_hours)
    // TODO: Read 2 from config
    if (all_class_hours <= 2) {
        await wechat.sendRenewTpl(userId, all_class_hours).catch(e => console.error('wechat:sendRenewTpl', e))
    }

    const newClassHours = {
        user_id: userId,
        class_hours: new_class_hours,
    }

    if (currentClassHours.length > 0) {
        await trx('user_balance')
            .where('user_id', userId)
            .update(newClassHours)
    } else {
        await trx('user_balance').insert(newClassHours)
    }

    logger.info('consumed for ', userId)
}

async function chargeClassHours(trx, userId, classHours, remark = '') {
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
}

module.exports = {
    consume: consumeClassHours,
    charge: chargeClassHours,
    countBookedClasses,
}
