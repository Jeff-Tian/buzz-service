import logger from '../common/logger'

const env = process.env.NODE_ENV || 'test'
const config = require('../../knexfile')[env]
const knex = require('knex')(config)
const pkg = require('../../package.json')

const healthCheck = async ctx => {
    const state = {
        everything: 'is ok',
        env,
        version: pkg.version,
    }

    ctx.body = state
}
module.exports = { healthCheck }
