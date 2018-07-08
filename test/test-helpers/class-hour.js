const chai = require('chai')
const server = require('../../server/index')

module.exports = {
    async charge(user_id, classHours) {
        return await chai
            .request(server)
            .put(`/api/v1/user-balance/${user_id}/`)
            .send({
                class_hours: classHours,
            })
    },
}
