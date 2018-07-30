import ClassScheduleBLL from '../bll/class-schedules'

export default class ClassSubscribersController {
    static async getSubscribers(ctx, next) {
        ctx.body = await ClassScheduleBLL.getSubscribers(ctx.params.class_id)
    }
}
