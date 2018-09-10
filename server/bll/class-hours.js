import * as userBll from './user'
import { NeedChargeThreshold, UserTags } from '../common/constants'
import AOP from '../AOP'
import UserState, { UserStates } from './user-state'

const _ = require('lodash')
const env = process.env.NODE_ENV || 'test'
const knexConfig = require('../../knexfile')[env]
const knex = require('knex')(knexConfig)

const countFrozenClassHours = async (user_id, trx = knex) => {
    const subQuery = trx('classes')
        .leftJoin('student_class_schedule', 'classes.class_id', 'student_class_schedule.class_id')
        .select(
            'classes.status as class_status',
            'classes.class_id as class_id',
            'student_class_schedule.status as schedule_status',
            knex.raw('CASE WHEN classes.class_hours is null THEN 1 ELSE classes.class_hours END as class_hours')
        )
        .where({ user_id, 'student_class_schedule.status': 'confirmed' })
        .whereIn('classes.status', ['opened', 'cancelled']).as('t')

    const result = await trx(subQuery)
        .sum('t.class_hours as class_hour_count')

    return _.get(result, '0.class_hour_count') || 0
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

async function consume(trx, userId, classHours, remark = '', by = null) {
    const transactionOrKnex = trx || knex

    await transactionOrKnex('user_balance_history')
        .insert({
            timestamp: new Date(),
            user_id: userId,
            type: 'h',
            event: 'consume',
            amount: -classHours,
            remark,
            by,
        })
    const currentClassHours = await getCurrentClassHours(transactionOrKnex, userId)

    const currentBalance = currentClassHours.length > 0 ? currentClassHours[0].class_hours : 0
    const newBalance = currentBalance - Number(classHours)

    const newClassHours = {
        user_id: userId,
        class_hours: newBalance,
    }

    if (currentClassHours.length > 0) {
        await transactionOrKnex('user_balance')
            .where('user_id', userId)
            .update(newClassHours)
    } else {
        await transactionOrKnex('user_balance').insert(newClassHours)
    }

    const frozenClassHours = await countFrozenClassHours(userId, transactionOrKnex)

    const latest = await getCurrentClassHours(transactionOrKnex, userId)
    const latestBalance = latest.length > 0 ? latest[0].class_hours : 0
    if (latestBalance + frozenClassHours <= NeedChargeThreshold) {
        await userBll.tryAddTags(userId, [{
            name: UserTags.NeedCharge,
            remark: '扣课时后课时不足自动添加此标签',
        }], transactionOrKnex)
    }
}

async function charge(trx, userId, classHours, remark = '', by = null, skipTag) {
    if (trx === null) {
        trx = knex
    }

    await trx('user_balance_history')
        .insert({
            timestamp: new Date(),
            user_id: userId,
            type: 'h',
            event: 'charge',
            amount: classHours,
            remark,
            by,
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

    if (!skipTag) {
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
}

AOP.setAfter()
module.exports = {
    consume: consume.afterAsync(async (result, trx, userId) => {
        async function changeUserState() {
            const user = await userBll.get(userId)
            if (user.class_hours <= 0) {
                const currentState = await UserState.getLatest(userId)
                if (currentState.state === UserStates.Demo) {
                    await UserState.tag(userId, UserStates.WaitingForPurchase, 'demo user runs out of class hours')
                }

                if (currentState.state === UserStates.InClass) {
                    await UserState.tag(userId, UserStates.WaitingForRenewal, 'inclass user runs out of class hours')
                }
            }
        }

        if (trx) {
            trx.commit = trx.commit.afterAsync(changeUserState)
        } else {
            await changeUserState()
        }
    }),
    charge,
    countBookedClasses: countFrozenClassHours,
    getAllClassHours,
}
