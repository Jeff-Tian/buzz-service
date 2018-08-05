import ClassHoursController from '../controllers/classHoursController'

const Router = require('koa-router')
const router = new Router()
const BASE_URL = '/api/v1/class-hours'
router.get(`${BASE_URL}/history/:user_id`, ClassHoursController.getHistoryByUserId)

module.exports = router
