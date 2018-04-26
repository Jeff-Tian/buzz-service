const common = require('./common')
const chai = require('chai')
const server = require('../../server/index')

module.exports = {
    async charge(user_id, classHours) {
        return await (new Promise((resolve, reject) => {
            chai
                .request(server)
                .put(`/api/v1/user-balance/${user_id}/`)
                .send({
                    class_hours: classHours,
                })
                .end(common.convertErrorResultToResolveReject(resolve, reject))
        }))
    },
}
