import ClassScheduleDAL from '../dal/class-schedules'

const user = require('../dal/user')
const uuidv4 = require('uuid/v4')

/*eslint-disable */
class UserNotFoundError extends Error {
}

/* eslint-enable */

class UserHasConfirmedGroupsCanNotChangeRoleError extends Error {
}

module.exports = {
    UserNotFoundError,
    UserHasConfirmedGroupsCanNotChangeRoleError,
    async get(userId) {
        const theUser = await user.get(userId)

        if (theUser) {
            return theUser
        }

        throw new this.UserNotFoundError(`User with id ${userId} not found`, uuidv4())
    },

    MemberType: {
        Student: 's',
        Companion: 'c',
        Adviser: 'a',
    },

    getWechatByUserIds: user.getWechatByUserIds,
    getUsersByClassId: user.getUsersByClassId,
    getUsersByWeekly: user.getUsersByWeekly,
    async isProfileOK(userId) {
        const theUser = await user.get(userId)

        if (theUser) {
            if (theUser.role === this.MemberType.Student) {
                if (!theUser.mobile) {
                    return false
                }
            }

            if (theUser.role === this.MemberType.Companion) {
                if (!theUser.email) {
                    return false
                }
            }

            return true
        }

        throw new this.UserNotFoundError(`User with id ${userId} not found`, uuidv4())
    },
    async changeUserRole({ role }, trx, user_id) {
        const theUser = await user.get(user_id)

        if (!theUser) {
            throw new this.UserNotFoundError(`User with id ${user_id} not found`, uuidv4())
        }

        const confirmedGroups = await
        ClassScheduleDAL.hasConfirmedClassSchedules(user_id)

        if (confirmedGroups.length > 0) {
            if (theUser.role !== role) {
                throw new UserHasConfirmedGroupsCanNotChangeRoleError(`The user ${user_id} has confirmed groups so can't change role to ${role} from ${theUser.role}`, uuidv4())
            }
        } else {
            // TODO: Delete timezone settings
            await trx('users').where('user_id', user_id).update({
                role,
            })
        }
    },
}
