import logger from '../common/logger'

const Redis = require('ioredis')
const config = require('../config')

const redis = new Redis(config.endPoints.redis)

redis.on('ready', () => {
    logger.info('redis:default', 'ready')
})
redis.on('error', e => {
    logger.info('redis:default:error', e)
})

module.exports = {
    redis,
}
