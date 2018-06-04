const server = require('../../server/index')
const chai = require('chai')
const chaiHttp = require('chai-http')
chai.use(chaiHttp)

module.exports = {
    async makeRequest(method, uri, data = {}, auth) {
        const c = chai
            .request(server)[method](uri)

        if (auth) {
            c.auth(auth.user, auth.pass)
        }

        return c
            .send(data)
    },
}
