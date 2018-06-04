const common = require('./common')
const chai = require('chai')
const server = require('../../server/index')

module.exports = {
    async createUserRequest(user) {
        return await
        chai
            .request(server)
            .post('/api/v1/users')
            .send(user)
    },
}
