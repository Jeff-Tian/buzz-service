import UserDemoBll from '../bll/user-demo'

export default class UserDemoController {
    static async insert(ctx) {
        await UserDemoBll.insert(ctx.params.user_id, ctx.request.body.training_time, ctx.request.body.demo_time)
        ctx.body = await UserDemoBll.getDemoTime(ctx.params.user_id)
    }

    static async get(ctx) {
        ctx.body = await UserDemoBll.getDemoTime(ctx.params.user_id)
    }
}
