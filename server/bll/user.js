import ClassScheduleDAL from '../dal/class-schedules'
import logger from '../common/logger'
import Tags from './tags'
import * as systemLogDal from '../dal/system-logs'

const user = require('../dal/user')
const uuidv4 = require('uuid/v4')
const knexConfig = require('../../knexfile')[(process.env.NODE_ENV || 'test')]
const knex = require('knex')(knexConfig)

/*eslint-disable */
class UserNotFoundError extends Error {
    constructor(message, id) {
        super(`${message} <${id}>`)
        this.name = 'UserNotFoundError'
    }
}

/* eslint-enable */

class UserHasConfirmedGroupsCanNotChangeRoleError extends Error {
    constructor(message, id) {
        super(`${message} <${id}>`)
        this.name = 'UserHasConfirmedGroupsCanNotChangeRoleError'
    }
}

module.exports = {
    UserNotFoundError,
    UserHasConfirmedGroupsCanNotChangeRoleError,
    async get(userId, isContextSecure = false) {
        const theUser = await user.get(userId, isContextSecure)

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
        const theUser = await user.get(userId, true)

        if (theUser) {
            if (theUser.role === this.MemberType.Student) {
                if (!theUser.mobile || (!theUser.city && !theUser.country && !theUser.location) || !theUser.date_of_birth || !theUser.name) {
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
    async getClassesByUserId(user_id) {
        return await ClassScheduleDAL.hasClassSchedules(user_id)
    },
    async changeUserRole({ role }, trx, user_id) {
        const theUser = await user.get(user_id)

        if (!theUser) {
            throw new this.UserNotFoundError(`User with id ${user_id} not found`, uuidv4())
        }

        const classGroups = await ClassScheduleDAL.hasClassSchedules(user_id)

        if (classGroups.length > 0) {
            if (theUser.role !== role) {
                throw new UserHasConfirmedGroupsCanNotChangeRoleError(`The user ${user_id} has confirmed groups so can't change role to ${role} from ${theUser.role}`, uuidv4())
            }
        } else {
            await trx('user_profiles').where('user_id', user_id).update({
                time_zone: null,
            })

            await trx('users').where('user_id', user_id).update({
                role,
            })
        }
    },

    async getSocialAccountProfile(userId) {
        console.log('checking for ', userId)
        return (await knex('user_social_accounts').where('user_id', userId))[0]
    },

    async listAllTags() {
        return user.listAllTags()
    },

    async getTags(userId) {
        return user.getTags(userId)
    },

    async addTags(userId, tags, ctx) {
        await Tags.checkHttpContext(ctx, tags)

        await systemLogDal.log(ctx.state.user.user_id, `tags ${userId} with ${tags.join(', ')}`)
        await user.addTags(userId, tags)
    },

    async tryAddTags(userId, tags, trx) {
        try {
            await user.addTags(userId, tags, trx)
        } catch (ex) {
            logger.error(ex)
        }
    },

    async deleteTags(userId, tags, ctx) {
        await Tags.checkHttpContext(ctx, tags)

        await systemLogDal.log(ctx.state.user.user_id, `delete tags from ${userId} of ${tags.join(', ')}`)
        await user.deleteTags(userId, tags)
    },

    async tryDeleteTags(userId, tags, trx) {
        try {
            await user.deleteTags(userId, tags, trx)
        } catch (ex) {
            logger.error(ex)
        }
    },

    async getUsersByTag(tag) {
        return await user.getUsersByTag(tag)
    },

    async isOfSystemUsers(userId) {
        return !(await Tags.superUserExists()) || Tags.containSystemUserTags((await user.getTags(userId)).map(t => t.tag))
    },

    async isSuper(userId) {
        return Tags.containSystemUserTags((await user.getTags(userId)).map(t => t.tag))
    },

    filterUsersByState(search, state) {
        if (state === 'potential') {
            return user.filterPotentials(search)
        }

        if (state === 'leads') {
            return user.filterLeads(search)
        }

        if (state === 'purchase') {
            return user.filterPurchases(search)
        }

        if (state === 'waitingforplacementtest') {
            return user.filterWaitingForPlacementTest(search)
        }

        return search
    },
}
