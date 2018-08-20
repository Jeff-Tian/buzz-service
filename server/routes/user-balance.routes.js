import AOP from '../AOP'
import UserState, { UserStates } from '../bll/user-state'

const Router = require('koa-router')
const router = new Router()
const userBalanceController = require('../controllers/userBalanceController')
const BASE_URL = '/api/v1/user-balance'
AOP.setAfter()
router.put(`${BASE_URL}/:user_id`, userBalanceController.chargeClassHour.afterAsync(async (result, ctx) => {
    const currentState = await UserState.getLatest(ctx.params.user_id)

    if (!currentState) {
        return
    }

    if (currentState.state === UserStates.Lead && ctx.request.body.class_hours < 12) {
        await UserState.tag(ctx.params.user_id, UserStates.Demo, 'lead user bought class_hours less than 12')
    }

    if (ctx.request.body.class_hours >= 12 && [UserStates.Lead, UserStates.Demo, UserStates.WaitingForPurchase].includes(currentState.state)) {
        await UserState.tag(ctx.params.user_id, UserStates.InClass, 'lead, demo or waitingforpurchase user bought more than 12 class hours')
    }
}))
router.put(`${BASE_URL}/integral/:user_id`, userBalanceController.chargeIntegral)
router.del(`${BASE_URL}/:user_id`, userBalanceController.consumeClassHour)
router.del(`${BASE_URL}/integral/:user_id`, userBalanceController.consumeIntegral)
router.get(`${BASE_URL}/:type/:user_id`, userBalanceController.get)

module.exports = router
