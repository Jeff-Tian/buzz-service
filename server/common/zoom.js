const _ = require('lodash')
const axios = require('axios')
const jwt = require('jsonwebtoken')

const Zoom = {
    genToken() {
        return jwt.sign({ iss: '39Wrd5SETG-aZLhsP04D3w', exp: ((new Date()).getTime() + 5000) }, 'BQ2bpa1N1vRf0olYgpzeQMV3EuLnwxyel10M')
    },
    async api({ url, method = 'get', params, data }) {
        const opt = {
            validateStatus: () => true,
            method,
            baseURL: 'https://api.zoom.us/v2/',
            url,
            headers: { Authorization: `Bearer ${this.genToken()}` },
            params,
            data,
        }
        const { data: res } = await axios(opt)
        const msg = _.get(res, 'message')
        if (msg) {
            throw new Error(msg)
        }
        return res
    },
    async getDailyReport() {
        return await this.api({ url: '/report/daily' })
    },
    async getMeetingParticipantsReport(meetingId) {
        return await this.api({ url: `/meetings/${meetingId}/participants` })
    },
    async listUsers() {
        return await this.api({ url: '/users' })
    },
    async retrieveUserToken(userId) {
        return await this.api({ url: `/users/${userId}/token`, params: { type: 'zak' } })
    },
    async listMeetings(userId) {
        return await this.api({ url: `/users/${userId}/meetings` })
    },
    async listRecordings(userId) {
        return await this.api({ url: `/users/${userId}/recordings` })
    },
    async createUser(action, user_info) {
        return await this.api({ url: '/users', method: 'post', data: { action, user_info } })
    },
    async updateUser(userId, data) {
        return await this.api({ url: `/users/${userId}`, method: 'patch', data })
    },
    async createMeeting(userId, meeting) {
        return await this.api({ url: `/users/${userId}/meetings`, method: 'post', data: meeting })
    },
    async deleteMeeting(meetingId) {
        return await this.api({ url: `/meetings/${meetingId}`, method: 'delete' })
    },
    async listMeetingRegistrants(meetingId) {
        return await this.api({ url: `/meetings/${meetingId}/registrants`, method: 'get' })
    },
}

module.exports = Zoom
