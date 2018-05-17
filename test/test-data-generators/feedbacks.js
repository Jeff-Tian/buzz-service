import * as common from '../test-helpers/common'

export default class Feedbacks {
    static async giveFeedback(from, to, data) {
        await common.makeRequest('post', '/api/v1/class-feedback', {})
    }
}
