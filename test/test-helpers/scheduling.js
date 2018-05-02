const queryString = require('query-string')
const common = require('./common')

module.exports = {
    async listScheduleForStudentRequest(user_id) {
        return await common.makeRequest('get', `/api/v1/student-class-schedule/${user_id}`)
    },

    async listScheduleForCompanionRequest(user_id) {
        return await common.makeRequest('get', `/api/v1/companion-class-schedule/${user_id}`)
    },
}
