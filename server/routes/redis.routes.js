import RedisController from '../controllers/redisController'

const Router = require('koa-router')
const router = new Router()
const BASE_URL = '/api/v1/redis'
router.post(`${BASE_URL}/set/:key`, RedisController.set)
router.get(`${BASE_URL}/get/:key`, RedisController.get)
module.exports = router
