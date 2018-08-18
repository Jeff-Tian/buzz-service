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
}
