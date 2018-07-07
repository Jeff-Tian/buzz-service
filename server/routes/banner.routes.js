const Router = require('koa-router')
const router = new Router()
const bannerController = require('../controllers/bannerController')
const BASE_URL = '/api/v1/banner'
router.get(`${BASE_URL}/available`, bannerController.available)
router.get(`${BASE_URL}/:id`, bannerController.getById)
router.get(`${BASE_URL}`, bannerController.query)
router.post(`${BASE_URL}`, bannerController.upsert)

module.exports = router
