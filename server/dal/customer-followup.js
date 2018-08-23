const env = process.env.NODE_ENV || 'test'
const config = require('../../knexfile')[env]
const knex = require('knex')(config)
require('../common/knex')

export default class CustomerFollowupDal {
    static getFollowupHistoryByUserId(userId, pageSize = 100, currentPage = 1) {
        return knex('customer_follow_up')
            .select('timestamp', 'remark', 'followed_by')
            .where({
                user_id: userId,
            })
            .orderBy('timestamp', 'desc')
            .paginate(pageSize, currentPage)
    }

    static saveFollowupRecord(userId, followedBy, remark) {
        return knex('customer_follow_up')
            .insert({
                timestamp: new Date(),
                remark,
                user_id: userId,
                followed_by: followedBy,
            })
    }
}
