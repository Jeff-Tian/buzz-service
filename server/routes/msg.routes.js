const Router = require('koa-router')
const router = new Router()
const msgController = require('../controllers/msgController')
const BASE_URL = '/api/v1/msg'
router.get(`${BASE_URL}`, msgController.query)
router.get(`${BASE_URL}/:to_user_id`, msgController.queryByToUser)
router.post(`${BASE_URL}`, msgController.upsert)

module.exports = router
