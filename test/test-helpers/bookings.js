const Router = require('koa-router')

const common = require('./common')

module.exports = {
    async batchCreateBookingsRequest({ user_id, start_time, end_time }) {
        return await common.makeRequest('post', `/api/v1/bookings/batch/${user_id}`, {
            user_id,
            start_time,
            end_time,
        })
    },

    async listBatchBookingsForSingleUserRequest(user_id) {
        return await common.makeRequest('get', `/api/v1/bookings/batch/${user_id}`)
    },

    async listBatchBookingsForMultipleUserRequest(userIdArray) {
        return await common.makeRequest('get', Router.url('/api/v1/bookings/batch', {
            users: userIdArray,
        }))
    },
}
