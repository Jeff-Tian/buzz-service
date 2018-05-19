const Router = require('koa-router')
const router = new Router()
const contentController = require('../controllers/contentController')
const BASE_URL = '/api/v1/content'
router.get(`${BASE_URL}`, contentController.query)
router.post(`${BASE_URL}`, contentController.upsert)
router.get(`${BASE_URL}/topic`, contentController.topic)

module.exports = router
