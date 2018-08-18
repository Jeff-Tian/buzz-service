import AOP from '../AOP'
import * as UserState from '../bll/user-state'

const Router = require('koa-router')
const router = new Router()
const usersController = require('../controllers/usersController')
const BASE_URL = '/api/v1/users'
router.get(`${BASE_URL}/available`, usersController.getAvailableUsers)
router.get(`${BASE_URL}/withAvailability`, usersController.getWithAvailability)
router.get(`${BASE_URL}`, usersController.search)
router.get(`${BASE_URL}/by-facebook/:facebook_id`, usersController.getByFacebookId)
router.get(`${BASE_URL}/by-wechat`, usersController.getByWechat)
router.get(`${BASE_URL}/:user_id`, usersController.show)
router.get(`${BASE_URL}/feedback/:class_id`, usersController.getUserInfoByClassId)
AOP.setAfter()
router.post(`${BASE_URL}`, usersController.create.afterAsync(async ctx => {
    await UserState.tag(ctx.body.user_id, UserState.States.Potential)
}))
router.post(`${BASE_URL}/byUserIdlist`, usersController.getByUserIdList)
router.put(`${BASE_URL}/sign-in`, usersController.signIn)
router.put(`${BASE_URL}/account-sign-in`, usersController.accountSignIn)
router.put(`${BASE_URL}/:user_id`, usersController.update)
router.post(`${BASE_URL}/appendOrderRemark/:user_id`, usersController.appendOrderRemark)
router.del(`${BASE_URL}/:user_id`, usersController.delete)
router.get(`${BASE_URL}/is-profile-ok/:user_id`, usersController.isProfileOK)
router.post(`${BASE_URL}/sendScheduleMsg/:user_id`, usersController.sendScheduleMsg)
router.get(`${BASE_URL}/social-account-profile/:user_id`, usersController.getSocialAccountProfile)
router.get('/api/v1/tags', usersController.listAllTags)
router.get(`${BASE_URL}/tags/:user_id`, usersController.getTags)
router.del(`${BASE_URL}/tags/:user_id`, usersController.deleteTags)
router.post(`${BASE_URL}/tags/:user_id`, usersController.addTags)
module.exports = router
