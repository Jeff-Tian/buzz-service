const Router = require('koa-router')
const router = new Router()
const bannerController = require('../controllers/bannerController')
const BASE_URL = '/api/v1/banner'
router.get(`${BASE_URL}/getByUserRole`, bannerController.getByUserRole)
router.get(`${BASE_URL}`, bannerController.query)
router.post(`${BASE_URL}`, bannerController.upsert)

module.exports = router
