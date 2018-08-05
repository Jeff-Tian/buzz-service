import ClassHourHistoryBll from '../bll/class-hour-history'

export default class ClassHoursController {
    static async getHistoryByUserId(ctx) {
        return ClassHourHistoryBll.getHistoryByUserId(ctx.params.user_id)
    }
}
