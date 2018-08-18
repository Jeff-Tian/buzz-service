import logger from '../common/logger'
import { ClassStatusCode, UserTags } from '../common/constants'

const env = process.env.NODE_ENV || 'test'
const config = require('../../knexfile')[env]
const knex = require('knex')(config)
const moment = require('moment-timezone')
const _ = require('lodash')
const timeHelper = require('../common/time-helper')

function countClassHoursSubQuery(classStatusCodes, asTableName) {
    return knex
        .from(function () {
            this.select('user_id').sum({ class_hours: 'classes.class_hours' }).from('student_class_schedule')
                .leftJoin('classes', 'student_class_schedule.class_id', 'classes.class_id')
                .whereIn('classes.status', classStatusCodes).groupBy('user_id').as('t1')
        }, false)
        .unionAll(function () {
            this.select('user_id').count({ class_hours: 'classes.class_hours' }).from('companion_class_schedule')
                .leftJoin('classes', 'companion_class_schedule.class_id', 'classes.class_id')
                .whereIn('classes.status', classStatusCodes).groupBy('user_id')
        }, false)
        .as(asTableName)
}

module.exports = {
    joinTables(filters = {}) {
        const interestsSubQuery = knex('user_interests').select('user_id', knex.raw('group_concat(interest) as interests')).groupBy('user_id').as('user_interests')

        let userTagsSubQuery = knex('user_tags').select('user_id', knex.raw('group_concat(tag) as tags'))
        if (filters.tags instanceof Array) {
            userTagsSubQuery = userTagsSubQuery.whereIn('tag', filters.tags)
        }
        userTagsSubQuery = userTagsSubQuery.groupBy('user_id').as('user_tags')

        const lockedClassHoursSubQuery = countClassHoursSubQuery([ClassStatusCode.Open], 'user_locked_class_hours')
        const bookedClassHoursSubQuery = countClassHoursSubQuery([ClassStatusCode.Open, ClassStatusCode.Cancelled], 'user_booked_class_hours')

        const consumedClassHoursSubQuery = countClassHoursSubQuery([ClassStatusCode.End], 'user_consumed_class_hours')

        return knex('users')
            .leftJoin('user_profiles', 'users.user_id', 'user_profiles.user_id')
            .leftJoin('user_social_accounts', 'users.user_id', 'user_social_accounts.user_id')
            .leftJoin('user_balance', 'users.user_id', 'user_balance.user_id')
            .leftJoin('user_placement_tests', 'users.user_id', 'user_placement_tests.user_id')
            .leftJoin(userTagsSubQuery, 'users.user_id', 'user_tags.user_id')
            .leftJoin(interestsSubQuery, 'users.user_id', 'user_interests.user_id')
            .leftJoin(lockedClassHoursSubQuery, 'users.user_id', 'user_locked_class_hours.user_id')
            .leftJoin(bookedClassHoursSubQuery, 'users.user_id', 'user_booked_class_hours.user_id')
            .leftJoin(consumedClassHoursSubQuery, 'users.user_id', 'user_consumed_class_hours.user_id')
            .groupBy('users.user_id')
    },
    selectFields(joinedTables, isContextSecure) {
        return joinedTables
            .select(
                'users.user_id as user_id', 'users.name as name', 'users.created_at as created_at',
                'users.role as role', 'users.remark as remark', 'user_profiles.avatar as avatar',
                'user_profiles.display_name as display_name', 'user_profiles.school_name as school_name', 'user_profiles.time_zone as time_zone', 'user_profiles.order_remark as order_remark',
                'user_profiles.youzan_mobile as youzan_mobile', 'user_profiles.intro_done as intro_done', 'user_profiles.weekly_schedule_requirements as weekly_schedule_requirements', 'user_profiles.gender as gender',
                'user_profiles.date_of_birth as date_of_birth',
                isContextSecure ? 'user_profiles.mobile as mobile' : knex.raw('(CASE WHEN user_profiles.mobile IS NOT NULL THEN "***********" ELSE null END) as mobile'),
                isContextSecure ? 'user_profiles.email as email' : knex.raw('(CASE WHEN user_profiles.email IS NOT NULL THEN "***@***" ELSE null END) as email'),
                'user_profiles.language as language', 'user_profiles.location as location',
                'user_profiles.description as description', 'user_profiles.grade as grade',
                'user_profiles.parent_name as parent_name', 'user_profiles.country as country',
                'user_profiles.city as city',
                'user_social_accounts.facebook_id as facebook_id',
                'user_social_accounts.wechat_data as wechat_data',
                'user_social_accounts.facebook_name as facebook_name',
                'user_social_accounts.wechat_name as wechat_name',
                'user_social_accounts.wechat_openid as wechat_openid',
                'user_balance.class_hours as class_hours',
                'user_balance.integral as integral', 'user_placement_tests.detail as placement_test',
                'user_placement_tests.level as level',
                isContextSecure ? 'user_profiles.password as password' : knex.raw('(CASE WHEN user_profiles.password IS NOT NULL THEN "******" ELSE null END) as password'),
                'user_interests.interests',
                'user_tags.tags',
                knex.raw('sum(user_locked_class_hours.class_hours) as' +
                    ' locked_class_hours'),
                knex.raw('sum(user_booked_class_hours.class_hours) as' +
                    ' booked_class_hours'),
                knex.raw('sum(user_consumed_class_hours.class_hours) as' +
                    ' consumed_class_hours')
            )
    },
    async get(userId, isContextSecure = false) {
        return (await this.selectFields(this.joinTables(), isContextSecure)
            .where({ 'users.user_id': userId }))[0]
    },

    async getWechatByUserIds(userIds) {
        return await knex('users')
            .leftJoin('user_social_accounts', 'users.user_id', 'user_social_accounts.user_id')
            .whereIn('users.user_id', userIds)
            .whereNotNull('user_social_accounts.wechat_openid')
            .whereNot('user_social_accounts.wechat_openid', '')
            .select('user_social_accounts.wechat_openid', 'user_social_accounts.wechat_name', 'users.name', 'users.user_id', 'users.role')
    },

    async getUsersByClassId({ class_id, class_status = ['opened', 'ended'], role = ['student', 'companion'] }) {
        const classInfo = _.get(await knex('classes').where({ class_id }).whereIn('classes.status', class_status).select('class_id', 'topic', 'status', 'start_time', 'end_time', 'room_url', 'evaluate_disabled', 'notification_disabled'), 0)
        if (!classInfo) return
        let students = []
        if (_.includes(role, 'student')) {
            const studentQuery = knex('student_class_schedule')
                .leftJoin('user_profiles', 'student_class_schedule.user_id', 'user_profiles.user_id')
                .leftJoin('user_social_accounts', 'student_class_schedule.user_id', 'user_social_accounts.user_id')
                .leftJoin('users', 'student_class_schedule.user_id', 'users.user_id')
                .where({
                    'student_class_schedule.class_id': class_id,
                })
                .whereIn('student_class_schedule.status', ['ended', 'confirmed'])
                .select(
                    'user_social_accounts.wechat_openid as wechat_openid',
                    'user_social_accounts.wechat_name as wechat_name',
                    'student_class_schedule.user_id as user_id',
                    'user_profiles.email as email',
                    'user_profiles.time_zone as time_zone',
                    'users.name as name',
                )
            students = await studentQuery
        }
        let companions = []
        if (_.includes(role, 'companion')) {
            const companionQuery = knex('companion_class_schedule')
                .leftJoin('user_social_accounts', 'companion_class_schedule.user_id', 'user_social_accounts.user_id')
                .leftJoin('user_profiles', 'companion_class_schedule.user_id', 'user_profiles.user_id')
                .leftJoin('users', 'companion_class_schedule.user_id', 'users.user_id')
                .select(
                    'user_social_accounts.wechat_openid as wechat_openid',
                    'user_social_accounts.wechat_name as wechat_name',
                    'companion_class_schedule.user_id as user_id',
                    'user_profiles.email as email',
                    'user_profiles.time_zone as time_zone',
                    'users.name as name',
                )
                .where({
                    'companion_class_schedule.class_id': class_id,
                })
                .whereIn('companion_class_schedule.status', ['ended', 'confirmed'])
            companions = await companionQuery
        }
        return { classInfo, students, companions }
    },

    async getUsersByWeekly(state, r) {
        // knex.on('query', query => { logger.info('getUsersByWeekly', query) })
        // 总排课数: 本周所有状态的排课
        // 需求数: 本周排课需求

        // 超额排课(表示异常情况, 需要处理): 需求数 < 总排课数 或 可排课课时数 < 0
        // 无需排课: 不满足超额排课, 且 总排课数 = 可排课课时数 = 0
        // 排课完成: 不满足超额排课, 且 需求数 = 已发布排课数 > 0
        // 需排课: 不满足超额排课, 且 (可排课课时数+草稿排课数) > 0 且 已发布排课数 < 需求数

        // 需排课 need, 排课完成 done, 超额排课 excess, 无需排课 no_need
        const role = { s: 'student', c: 'companion' }[r]
        const schedule = `${role}_class_schedule`
        const start_time = timeHelper.convertToDBFormat(moment(moment().format('YYYY-MM-DD 00:00:00')).isoWeekday(1).toISOString())
        const end_time = timeHelper.convertToDBFormat(moment(moment().format('YYYY-MM-DD 00:00:00')).isoWeekday(8).toISOString())
        let query = knex('users')
            .leftJoin('user_profiles', 'users.user_id', 'user_profiles.user_id')
            .leftJoin('user_balance', 'users.user_id', 'user_balance.user_id')
            // .joinRaw(`LEFT JOIN ${schedule} ON users.user_id = ${schedule}.user_id`)
            .joinRaw(`LEFT JOIN ${schedule} ON users.user_id = ${schedule}.user_id AND ${schedule}.status IN ('confirmed', 'ended') AND ${schedule}.start_time > '${start_time}' AND ${schedule}.start_time <= '${end_time}' AND (${schedule}.class_id IS NOT NULL AND ${schedule}.class_id != '')`)
            .leftJoin('classes', 'classes.class_id', `${schedule}.class_id`)
            .where('users.role', r)
            .groupBy('users.user_id')
            .select(
                knex.raw('ifnull(user_profiles.weekly_schedule_requirements, 1) as req'),
                knex.raw('(CASE WHEN (user_balance.class_hours IS NULL OR user_balance.class_hours  = \'\') THEN 0 ELSE user_balance.class_hours END) as hours'),
                'users.user_id as user_id',
                knex.raw('SUM(CASE WHEN classes.status IN (\'opened\', \'ended\') THEN 1 ELSE 0 END) AS done_count'),
                knex.raw('SUM(CASE WHEN classes.status IN (\'cancelled\') THEN 1 ELSE 0 END) AS cancelled_count'),
                knex.raw('SUM(CASE WHEN classes.status IN (\'opened\', \'ended\', \'cancelled\') THEN 1 ELSE 0 END) AS total_count'),
                knex.raw(`MIN(CASE WHEN classes.status IN ('opened') THEN ${schedule}.start_time END) as min_opened_start_time`),
            )

        if (state === 'excess') {
            // hours: -1
            // req: 1, total_count: 2
            query = query.havingRaw('(req < total_count) OR (hours < 0)')
        } else if (state === 'no_need') {
            // hours: 0, total_count: 0
            query = query.havingRaw('((req >= total_count) AND (hours >= 0)) AND (total_count = 0 AND hours = 0)')
        } else if (state === 'done') {
            // hours: 0, done_count: 1, req: 1
            query = query.havingRaw('((req >= total_count) AND (hours >= 0)) AND (req = done_count AND done_count > 0)')
        } else if (state === 'need') {
            //  hours: 0, total_count: 1, cancelled_count: 1, done_count: 0, req: 1
            query = query.havingRaw('((req >= total_count) AND (hours >= 0)) AND ((hours + cancelled_count) > 0 AND (req > done_count))')
            // } else if (state === 'confirmed') {
            //     // hours: 0, done_count: 1, req: 1
            //     query = query.havingRaw('done_count >= req AND done_count > 0)')
        }
        let result = await query
        // logger.info('getUsersByWeekly', result)
        result = _.map(result, 'user_id') || []
        return result
    },

    async listAllTags() {
        return await knex('user_tags')
            .distinct('tag')
            .select()
    },

    async getTags(userId) {
        return await knex('user_tags')
            .where('user_id', userId)
    },

    async deleteTags(userId, tags, trx = knex) {
        return await trx('user_tags')
            .whereIn('tag', tags)
            .andWhere('user_id', userId)
            .delete()
    },

    async addTags(userId, tags, trx = knex) {
        return await trx('user_tags')
            .returning('user_id')
            .insert(tags.map(tag => {
                if (typeof tag === 'string') {
                    return {
                        user_id: userId,
                        tag,
                    }
                }
                return {
                    user_id: userId,
                    tag: tag.name,
                    remark: tag.remark,
                }
            }))
    },

    async tryAddTags(userId, tags, trx = knex) {
        try {
            await this.addTags(userId, tags, trx)
        } catch (ex) {
            logger.error(ex)
        }
    },

    async getUsersByTag(tag) {
        return await knex('user_tags')
            .where('tag', tag)
    },

    filterPotentials(search) {
        return search.andWhereRaw('user_profiles.mobile is null')
    },

    filterLeads(search) {
        return search.andWhere('user_tags.tags', 'like', `%${UserTags.Leads}%`)
            .andWhereRaw(`user_profiles.mobile is not null and (user_profiles.city is not null or user_profiles.country is not null or user_profiles.location is not null)
        and user_profiles.date_of_birth is not null and users.name is not null
        `)
    },

    filterDemo(search) {
        return search.andWhere('user_balance.class_hours > 0 and (user_booked_class_hours.class_hours + user_consumed_class_hours.class_hours + user_balance.class_hours < 12)')
    },

    filterPurchases(search) {
        return search
            .andWhereRaw('user_balance.class_hours > 0 and user_booked_class_hours.class_hours is null and user_consumed_class_hours.class_hours is null')
    },

    filterWaitingForPlacementTest(search) {
        return search.andWhereRaw('user_placement_tests.detail is null')
    },

    filterWaitingForFirstClass(search) {
        return this.filterPurchases(search).andWhereRaw('user_placement_tests.level is not null')
    },

    filterRenewals(search) {
        return search.andWhere('user_tags.tags', 'like', `%${UserTags.NeedCharge}%`)
    },

    filterRefunded(search) {
        return search.andWhere('user_tags.tags', 'like', `%${UserTags.Refunded}%`)
    },

    async getUserIdByOpenId(openid) {
        return (await knex('user_social_accounts').where('wechat_openid', '=', openid).select('user_id'))[0].user_id
    },

    async getUserIdsByEmail(email) {
        return (await knex('user_profiles').where('email', '=', email)).select('user_id').map(o => o.user_id)
    },
}
