import UserState, { UserStates } from '../bll/user-state'
import AOP from '../AOP'
import * as userBll from '../bll/user'

const Router = require('koa-router')
const router = new Router()
const usersController = require('../controllers/usersController')
const BASE_URL = '/api/v1/users'
router.post(`${BASE_URL}/signInByMobileCode`, usersController.signInByMobileCode)
router.get(`${BASE_URL}/available`, usersController.getAvailableUsers)
router.get(`${BASE_URL}/withAvailability`, usersController.getWithAvailability)
router.get(`${BASE_URL}`, usersController.search)
router.get(`${BASE_URL}/by-facebook/:facebook_id`, usersController.getByFacebookId)
router.get(`${BASE_URL}/by-wechat`, usersController.getByWechat)
router.get(`${BASE_URL}/:user_id`, usersController.show)
router.get(`${BASE_URL}/feedback/:class_id`, usersController.getUserInfoByClassId)
AOP.setAfter()
router.post(`${BASE_URL}`, usersController.create.afterAsync(async (result, ctx) => {
    await UserState.tag(ctx.body, UserStates.Potential)
}))
router.post(`${BASE_URL}/byUserIdlist`, usersController.getByUserIdList)
router.put(`${BASE_URL}/sign-in`, usersController.signIn)
router.put(`${BASE_URL}/account-sign-in`, usersController.accountSignIn)
router.put(`${BASE_URL}/:user_id`, usersController.update.afterAsync(async (result, ctx) => {
    const latestState = await UserState.getLatest(ctx.params.user_id)
    const profile = await userBll.get(ctx.params.user_id, true)
    if (latestState.state === UserStates.Potential && profile.mobile) {
        await UserState.tag(ctx.params.user_id, UserStates.Lead)
    }
}))
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
