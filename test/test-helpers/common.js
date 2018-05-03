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

    async makeRequest(method, uri, data) {
        return await (new Promise((resolve, reject) => {
            chai
                .request(server)[method](uri)
                .send(data)
                .end(this.convertErrorResultToResolveReject(resolve, reject))
        }))
    },
}
