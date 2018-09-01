import logger from '../common/logger'
import UserStateDal from '../dal/user-state'

export const UserStates = {
    Potential: 'potential',
    Lead: 'lead',
    Demo: 'demo',
    WaitingForPurchase: 'waiting_purchase',
    InClass: 'in_class',
    WaitingForRenewal: 'waiting_renewal',
    Invalid: 'invalid',
}

export default class UserState {
    static async tag(userId, state, remark, trx) {
        await UserStateDal.insert({ user_id: userId, state, remark }, trx)
    }

    static async getLatest(userId, trx) {
        return await UserStateDal.getLatest(userId, trx)
    }
}
