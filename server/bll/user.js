const user = require('../dal/user')
const uuidv4 = require('uuid/v4')

/*eslint-disable */
class UserNotFoundError extends Error {
}

/* eslint-enable */

module.exports = {
    UserNotFoundError,
    async get(userId) {
        const theUser = await user.get(userId)

        if (theUser) {
            return theUser
        }

        throw new this.UserNotFoundError(`User with id ${userId} not found`, uuidv4)
    },

    MemberType: {
        Student: 's',
        Companion: 'c',
        Adviser: 'a',
    },

    getWechatByUserIds: user.getWechatByUserIds,
}
