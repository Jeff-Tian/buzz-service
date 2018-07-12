const Router = require('koa-router')
const router = new Router()
const classFeedbackController = require('../controllers/classFeedbackController')
const BASE_URL = '/api/v2/class-feedback'
router.post(`${BASE_URL}/:class_id/:from_user_id/evaluate/:to_user_id`, classFeedbackController.feedback)

module.exports = router
