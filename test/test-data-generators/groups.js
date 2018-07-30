import moment from 'moment'
import * as common from '../test-helpers/common'

export default class Groups {
    static async createClass(companions, students, subscribers) {
        const startTime = moment().add('h', 10).set('minute', 0).set('second', 0)
        return (await common.makeRequest('post', '/api/v1/class-schedule', {
            advisor_id: null,
            name: 'A test class group',
            level: 'level test',
            start_time: startTime,
            end_time: startTime.add('h', 0.5),
            status: 'opened',
            remark: 'this is a class group for testing',
            topic: 'no topic',
            room_url: 'whatever',
            exercises: ['empty'],
            students,
            companions,
            subscribers,
        })).body
    }
}
