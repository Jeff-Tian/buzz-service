const env = process.env.NODE_ENV || 'test'
const config = require('../../knexfile')[env]
const knex = require('knex')(config)

module.exports = {
    async get(userId) {
        return (await knex('users')
            .leftJoin('user_profiles', 'users.user_id', 'user_profiles.user_id')
            .leftJoin('user_social_accounts', 'users.user_id', 'user_social_accounts.user_id')
            .leftJoin('user_interests', 'users.user_id', 'user_interests.user_id')
            .leftJoin('user_balance', 'users.user_id', 'user_balance.user_id')
            .leftJoin('user_placement_tests', 'users.user_id', 'user_placement_tests.user_id')
            .groupByRaw('users.user_id')
            .select(
                'users.user_id as user_id', 'users.name as name', 'users.created_at as created_at',
                'users.role as role', 'users.remark as remark', 'user_profiles.avatar as avatar',
                'user_profiles.display_name as display_name', 'user_profiles.school_name as school_name', 'user_profiles.time_zone as time_zone', 'user_profiles.gender as gender',
                'user_profiles.date_of_birth as date_of_birth', 'user_profiles.mobile as mobile',
                'user_profiles.email as email', 'user_profiles.language as language', 'user_profiles.location as location',
                'user_profiles.description as description', 'user_profiles.grade as grade',
                'user_profiles.parent_name as parent_name', 'user_profiles.country as country',
                'user_profiles.city as city', 'user_social_accounts.facebook_id as facebook_id',
                'user_social_accounts.wechat_data as wechat_data', 'user_social_accounts.facebook_name as facebook_name',
                'user_social_accounts.wechat_name as wechat_name', 'user_balance.class_hours as class_hours',
                'user_balance.integral as integral',
                'user_placement_tests.level as level', 'user_profiles.password as password',
                knex.raw('group_concat(user_interests.interest) as interests')
            )
            .where({ 'users.user_id': userId }))[0]
    },

    async getWechatByUserIds(userIds) {
        return await knex('users')
            .leftJoin('user_social_accounts', 'users.user_id', 'user_social_accounts.user_id')
            .whereIn('users.user_id', userIds)
            .whereNotNull('user_social_accounts.wechat_openid')
            .whereNot('user_social_accounts.wechat_openid', '')
            .select('user_social_accounts.wechat_openid', 'user_social_accounts.wechat_name', 'users.name', 'users.user_id')
    },
}

