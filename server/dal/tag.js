const env = process.env.NODE_ENV || 'test'
const config = require('../../knexfile')[env]
const knex = require('knex')(config)

export default class TagDal {
    static async getTagsByUserId(userId) {
        return knex('user_tags')
            .where({ user_id: userId })
    }

    static async getUsersByTag(tag) {
        return await knex('user_tags')
            .where('tag', tag)
    }
}
