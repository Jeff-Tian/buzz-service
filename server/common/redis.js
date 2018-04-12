const Redis = require('ioredis')
const config = require('../config')

const redis = new Redis(config.endPoints.redis)

redis.on('ready', () => {
    console.log('redis:default', 'ready')
})
redis.on('error', e => {
    console.error('redis:default:error', e)
})

module.exports = {
    redis,
}
