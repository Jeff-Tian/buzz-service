import ClassHourHistoryBll from '../bll/class-hour-history'

export default class ClassHoursController {
    static getHistoryByUserId(userId) {
        return ClassHourHistoryBll.getHistoryByUserId(userId)
    }
}
