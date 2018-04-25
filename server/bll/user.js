const user = require('../dal/user')
const uuidv4 = require('uuid/v4')

class UserNotFoundError extends Error {
    constructor(s, id) {
        super(s, id)
    }
}

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
}
