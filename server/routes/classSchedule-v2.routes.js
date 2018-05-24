const Router = require('koa-router')
const router = new Router()
const classScheduleController = require('../controllers/classScheduleController')
const BASE_URL = '/api/v2/class-schedule'
router.get(`${BASE_URL}/:class_id`, classScheduleController.getClassByClassIdv2)
module.exports = router
