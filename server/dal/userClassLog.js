import logger from '../common/logger'

const promisify = require('../common/promisify')
const env = process.env.NODE_ENV || 'test'
const config = require('../../knexfile')[env]
const knex = require('knex')(config)
const _ = require('lodash')
const timeHelper = require('../common/time-helper')

module.exports = {
    async findOneById(user_class_log_id, trx = knex) {
        return user_class_log_id ? _.get(await trx('user_class_log').where({ user_class_log_id }), 0) : user_class_log_id
    },
    async upsert(data) {
        const trx = await promisify(knex.transaction)
        try {
            if (data.created_at) {
                data.created_at = timeHelper.convertToDBFormat(data.created_at)
            }
            if (data.updated_at) {
                data.updated_at = timeHelper.convertToDBFormat(data.updated_at)
            }
            let user_class_log_id = data.user_class_log_id
            const current = await this.findOneById(user_class_log_id, trx)

            if (current) {
                await trx('user_class_log')
                    .update(data)
                    .where('user_class_log_id', user_class_log_id)
            } else {
                delete data.user_class_log_id
                const result = await trx('user_class_log').insert(data)
                user_class_log_id = _.get(result, 0)
            }
            const result = await this.findOneById(user_class_log_id, trx)
            await trx.commit()
            return result
        } catch (e) {
            await trx.rollback()
            throw e
        }
    },
}
