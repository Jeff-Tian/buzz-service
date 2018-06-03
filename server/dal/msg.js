import logger from '../common/logger'

const promisify = require('../common/promisify')
const env = process.env.NODE_ENV || 'test'
const config = require('../../knexfile')[env]
const knex = require('knex')(config)
const _ = require('lodash')

module.exports = {
    async findOneById(msg_id) {
        return msg_id ? _.get(await knex('msg').where({ msg_id }), 0) : msg_id
    },
    async upsert(data) {
        let msg_id = data.msg_id
        const current = await this.findOneById(msg_id)

        if (current) {
            await knex('msg')
                .update(data)
                .where('msg_id', msg_id)
        } else {
            delete data.msg_id
            const result = await knex('msg').insert(data)
            msg_id = _.get(result, 0)
        }

        return await this.findOneById(msg_id)
    },
}
