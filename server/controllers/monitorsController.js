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

    logger.info('everything is ok log: ', state)
    logger.error('testing error message, please ignore it.')
    logger.trace('trace testing in health check')

    ctx.body = state
}
module.exports = { healthCheck }
