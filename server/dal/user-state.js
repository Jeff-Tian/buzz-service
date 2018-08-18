const env = process.env.NODE_ENV || 'test'
const config = require('../../knexfile')[env]
const knex = require('knex')(config)

export default class UserState {
    static async insert(data) {
        await knex('user_states').insert({
            ...data,
            timestamp: new Date(),
        })
    }

    static async getLatest(userId) {
        return (await knex('user_states').select('state', 'timestamp', 'remark')
            .where('user_id', '=', userId)
            .limit(1))[0]
    }
}
