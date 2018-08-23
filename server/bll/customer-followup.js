import CustomerFollowupDal from '../dal/customer-followup'

export default class CustomerFollowupBll {
    static saveFollowupRecord(userId, followedBy, remark) {
        return CustomerFollowupDal.saveFollowupRecord(userId, followedBy, remark)
    }

    static getFollowupHistory(userId, pageSize, currentPage) {
        return CustomerFollowupDal.getFollowupHistoryByUserId(userId, pageSize, currentPage)
    }
}
