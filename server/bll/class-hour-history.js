import ClassHourHistoryDal from '../dal/class-hour-history'

export default class ClassHourHistoryBll {
    static async getHistoryByUserId(userId) {
        return await ClassHourHistoryDal.getHistoryByUserId(userId)
    }
}
