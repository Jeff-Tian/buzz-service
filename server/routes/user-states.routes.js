import UserStatesController from '../controllers/userStatesController'

const Router = require('koa-router')
const router = new Router()
const BASE_URL = '/api/v1/user-states'
router.put(`${BASE_URL}/:user_id`, UserStatesController.updateUserState)

module.exports = router
