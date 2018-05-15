const auth = require('basic-auth')
const assert = require('assert')

module.exports = {
    validate(ctx) {
        // TODO: enable it after more tests
        return true
        // const user = auth(ctx)
        // return (user && (user.name === process.env.BASIC_NAME && user.pass === process.env.BASIC_PASS))
    },
}
