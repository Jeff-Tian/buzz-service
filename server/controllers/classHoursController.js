import ClassHourHistoryBll from '../bll/class-hour-history'

export default class ClassHoursController {
    static async getHistoryByUserId(ctx) {
        ctx.body = await ClassHourHistoryBll.getHistoryByUserId(ctx.params.user_id, ctx.query.pageSize, ctx.query.currentPage)
    }
}
