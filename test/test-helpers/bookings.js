const common = require('./common')
const chai = require('chai')
const server = require('../../server/index')

module.exports = {
    async batchCreateBookingsRequest({ user_id, start_time, end_time }) {
        return await (new Promise((resolve, reject) => {
            chai
                .request(server)
                .post(`/api/v1/bookings/batch/${user_id}`)
                .send({
                    user_id,
                    start_time,
                    end_time,
                })
                .end(common.convertErrorResultToResolveReject(resolve, reject))
        }))
    },
}
