const auth = require('basic-auth')
const assert = require('assert')

module.exports = {
    validate(ctx) {
        // TODO: Delete this line after thorough test on qa
        if (process.env.NODE_ENV === 'production') {
            return true
        }

        const user = auth(ctx)
        return (user && (user.name === process.env.BASIC_NAME && user.pass === process.env.BASIC_PASS))
    },
}
