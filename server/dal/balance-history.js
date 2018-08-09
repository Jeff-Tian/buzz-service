const env = process.env.NODE_ENV || 'test'
const config = require('../../knexfile')[env]
const knex = require('knex')(config)
require('../common/knex')

export default class BalanceHistoryDal {
    static getHistoryByTypeUserId(type, userId, pageSize = 100, currentPage = 1) {
        return knex('user_balance_history')
            .select('timestamp', 'event', 'amount', 'remark', 'by').where({
                user_id: userId,
                type,
            })
            .orderBy('timestamp', 'desc')
            .paginate(pageSize, currentPage)
    }
}
