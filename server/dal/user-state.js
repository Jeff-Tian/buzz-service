const env = process.env.NODE_ENV || 'test'
const config = require('../../knexfile')[env]
const knex = require('knex')(config)

export default class UserState {
    static async insert(data, trx = knex) {
        await trx('user_states').insert({
            ...data,
            timestamp: new Date(),
        })
    }

    static async getLatest(userId, trx = knex) {
        return (await trx('user_states').select('state', 'timestamp', 'remark')
            .where('user_id', '=', userId)
            .orderBy('timestamp', 'desc')
            .limit(1))[0] || {}
    }
}
