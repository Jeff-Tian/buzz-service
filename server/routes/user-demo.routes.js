import UserDemoController from '../controllers/userDemoController'

const Router = require('koa-router')
const router = new Router()
const BASE_URL = '/api/v1/user-demo'
router.get(`${BASE_URL}/:user_id`, UserDemoController.get)
router.post(`${BASE_URL}/:user_id`, UserDemoController.insert)

module.exports = router
