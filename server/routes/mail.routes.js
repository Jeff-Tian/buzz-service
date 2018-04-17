const Router = require('koa-router')
const router = new Router()
const mailController = require('../controllers/mailController')
const BASE_URL = '/api/v1/mail'
router.post(`${BASE_URL}/mail`, mailController.sendVerifyMail)
router.post(`${BASE_URL}/verify`, mailController.verifyByCode)

module.exports = router
