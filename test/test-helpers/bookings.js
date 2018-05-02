const queryString = require('query-string')
const common = require('./common')

module.exports = {
    async batchCreateBookingsRequest({ user_id, start_time, end_time, n }) {
        return await common.makeRequest('post', `/api/v1/bookings/batch/${user_id}`, {
            user_id,
            start_time,
            end_time,
            n,
        })
    },

    async listBatchBookingsForSingleUserRequest(user_id) {
        return await common.makeRequest('get', `/api/v1/bookings/batch/${user_id}`)
    },

    async cancelBatchBookingsForSingleUserRequest(userId, batchId) {
        return await common.makeRequest('del', `/api/v1/bookings/batch/${userId}/${batchId}`)
    },

    async listBatchBookingsForMultipleUserRequest(userIdArray) {
        return await common.makeRequest('get', `/api/v1/bookings/batch?${queryString.stringify({ users: userIdArray })}`)
    },

    async listAllBookingsForMultipleUserRequest(userIdArray) {
        return await common.makeRequest('get', `/api/v1/bookings/all?${queryString.stringify({ users: userIdArray })}`)
    },
}
