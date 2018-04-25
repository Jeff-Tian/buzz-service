const common = require('./common')
const chai = require('chai')
const server = require('../../server/index')

module.exports = {
    async createUserRequest(user) {
        return await (new Promise((resolve, reject) => {
            chai
                .request(server)
                .post('/api/v1/users')
                .send(user)
                .end(common.convertErrorResultToResolveReject(resolve, reject))
        }))
    },
}
