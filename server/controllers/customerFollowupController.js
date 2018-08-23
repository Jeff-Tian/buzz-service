import CustomerFollowupBll from '../bll/customer-followup'

export default class CustomerFollowupController {
    static async saveFollowupRecord(ctx) {
        await CustomerFollowupBll.saveFollowupRecord(ctx.params.user_id, ctx.state.user.user_id, ctx.request.body.remark)
        ctx.body = 'done'
    }

    static async getFollowupHistory(ctx) {
        ctx.body = await CustomerFollowupBll.getFollowupHistory(ctx.params.user_id)
    }
}
