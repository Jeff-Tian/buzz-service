const env = process.env.NODE_ENV || 'test'
const config = require('../../knexfile')[env]
const knex = require('knex')(config)

export default class ClassHourHistoryDal {
    static getHistoryByUserId(userId) {
        return knex('user_balance_history').select('timestamp', 'event', 'amount', 'remark').where({
            user_id: userId,
            type: 'h',
        })
    }
}
