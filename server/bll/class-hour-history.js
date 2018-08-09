import ClassHourHistoryDal from '../dal/class-hour-history'

export default class ClassHourHistoryBll {
    static async getHistoryByUserId(userId, pageSize, currentPage) {
        return await ClassHourHistoryDal.getHistoryByUserId(userId, pageSize, currentPage)
    }
}
