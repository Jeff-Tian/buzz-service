const Router = require('koa-router')
const router = new Router()
const userBalanceController = require('../controllers/userBalanceController')
const BASE_URL = '/api/v1/user-balance'
router.put(`${BASE_URL}/:user_id`, userBalanceController.chargeClassHour)
router.put(`${BASE_URL}/integral/:user_id`, userBalanceController.chargeIntegral)
router.del(`${BASE_URL}/:user_id`, userBalanceController.consumeClassHour)
router.del(`${BASE_URL}/integral/:user_id`, userBalanceController.consumeIntegral)
router.get(`${BASE_URL}/:type/:user_id`, userBalanceController.get)

module.exports = router
