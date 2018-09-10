import UserDemoDal from '../dal/user-demo-dal'

export default class UserDemoBll {
    static insert(userId, trainingTime, demoTime) {
        return UserDemoDal.insert(userId, trainingTime, demoTime)
    }

    static async getDemoTime(userId) {
        return await UserDemoDal.getDemoTime(userId)
    }
}
