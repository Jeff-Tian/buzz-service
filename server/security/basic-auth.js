const auth = require('basic-auth')
const assert = require('assert')

module.exports = {
    validate(ctx) {
        assert(process.env.BASIC_NAME, 'BASIC_NAME required')
        assert(process.env.BASIC_PASS, 'BASIC_PASS required')

        const user = auth(ctx)
        return (user && (user.name === process.env.BASIC_NAME && user.pass === process.env.BASIC_PASS))
    },
}
