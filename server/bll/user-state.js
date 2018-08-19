import logger from '../common/logger'
import UserStateDal from '../dal/user-state'

export const UserStates = {
    Potential: 'potential',
    Lead: 'lead',
    Demo: 'demo',
}

export default class UserState {
    static async tag(userId, state) {
        logger.info(`tag ${userId} to ${state}...`)
        await UserStateDal.insert({ user_id: userId, state, remark: 'newly created user' })
    }

    static async getLatest(userId) {
        return await UserStateDal.getLatest(userId)
    }
}
