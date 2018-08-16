const Router = require('koa-router')
const router = new Router()
const userClassLogController = require('../controllers/userClassLogController')
const BASE_URL = '/api/v1/userClassLog'
router.get(`${BASE_URL}`, userClassLogController.query)
router.post(`${BASE_URL}`, userClassLogController.upsert)

module.exports = router
