import ClassHourHistoryDal from '../dal/class-hour-history'

export default class ClassHourHistoryBll {
    static getHistoryByUserId(userId) {
        return ClassHourHistoryDal.getHistoryByUserId(userId)
    }
}
