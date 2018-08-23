import CustomerFollowupController from '../controllers/customerFollowupController'

const Router = require('koa-router')
const router = new Router()
const BASE_URL = '/api/v1/follow-up'
router.get(`${BASE_URL}/:user_id`, CustomerFollowupController.getFollowupHistory)
router.post(`${BASE_URL}/:user_id`, CustomerFollowupController.saveFollowupRecord)

module.exports = router
