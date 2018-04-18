const Router = require('koa-router')
const router = new Router()
const mailController = require('../controllers/mailController')
const BASE_URL = '/api/v1/mail'
router.post(`${BASE_URL}/verification`, mailController.sendVerificationMail)
router.post(`${BASE_URL}/verify`, mailController.verifyByCode)
router.post(`${BASE_URL}/send`, mailController.send)

module.exports = router
