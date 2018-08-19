import UserState from '../bll/user-state'

export default class UserStatesController {
    static async updateUserState(ctx) {
        await UserState.tag(ctx.params.user_id, ctx.request.body.newState)
        ctx.body = await UserState.getLatest(ctx.params.user_id)
    }
}
