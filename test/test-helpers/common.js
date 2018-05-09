const server = require('../../server/index')
const chai = require('chai')
const chaiHttp = require('chai-http')
chai.use(chaiHttp)

module.exports = {
    convertErrorResultToResolveReject(resolve, reject) {
        return (err, res) => {
            if (err) {
                reject(err)
            } else {
                resolve(res)
            }
        }
    },

    async makeRequest(method, uri, data = {}, auth) {
        return await (new Promise((resolve, reject) => {
            const c = chai
                .request(server)[method](uri)

            if (auth) {
                c.auth(auth.user, auth.pass)
            }

            c
                .send(data)
                .end(this.convertErrorResultToResolveReject(resolve, reject))
        }))
    },
}
