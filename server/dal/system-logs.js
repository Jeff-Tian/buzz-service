const env = process.env.NODE_ENV || 'test'
const config = require('../../knexfile')[env]
const knex = require('knex')(config)
const _ = require('lodash')

module.exports = {
    async log(who, didWhat, trx = knex) {
        try {
            return await trx('system_logs')
                .insert({
                    user_id: who,
                    remark: didWhat,
                })
        } catch (ex) {
            console.error(ex)

            return 'error'
        }
    },

    async getLogs(who, trx = knex) {
        try {
            return await trx('system_logs')
                .where({ user_id: who })
                .select('*')
        } catch (e) {
            console.error(e)

            return []
        }
    },

    async getAllLogs(trx = knex) {
        try {
            return await trx('system_logs')
                .select('*')
        } catch (ex) {
            console.error(ex)

            return []
        }
    },
}
