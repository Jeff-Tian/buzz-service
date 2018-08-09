import BalanceHistoryDal from '../dal/balance-history'

export default class BalanceHistoryBll {
    static async getHistoryByTypeUserId(type, userId, pageSize, currentPage) {
        return await BalanceHistoryDal.getHistoryByTypeUserId(type, userId, pageSize, currentPage)
    }
}
