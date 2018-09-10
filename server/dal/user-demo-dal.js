const env = process.env.NODE_ENV || 'test'
const config = require('../../knexfile')[env]
const knex = require('knex')(config)

export default class UserDemoDal {
    static insert(userId, trainingTime, demoTime) {
        return knex('user_demo').insert({
            user_id: userId,
            training_time: trainingTime,
            demo_time: demoTime,
        })
    }

    static async getDemoTime(userId) {
        return (await knex('user_demo').select('training_time', 'demo_time')
            .where('user_id', '=', userId)
            .limit(1))[0] || {}
    }
}
