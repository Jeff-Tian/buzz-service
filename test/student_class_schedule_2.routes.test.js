import moment from 'moment'
import * as common from './test-helpers/common'

const env = process.env.NODE_ENV || 'test'
const config = require('../knexfile')[env]
const server = require('../server/index')
const knex = require('knex')(config)
const PATH = '/api/v1/student-class-schedule'
// Require and configure the assertion library
const chai = require('chai')
const should = chai.should()
const chaiHttp = require('chai-http')
chai.use(chaiHttp)
// Rollback, commit and populate the test database before each test
describe('routes: student class schedule', () => {
    beforeEach(() => knex.migrate
        .rollback()
        .then(() => knex.migrate.latest())
        .then(() => knex.seed.run()))
    // Rollback the migration after each test
    afterEach(() => knex.migrate.rollback())
    // Here comes the first test

    describe('学生排课计划里，可以看到相关peer tutor信息', () => {
        it('我是学生，能从我的排课计划里看到相关peer tutor信息', async () => {
            const user = require('./test-helpers/user')
            const MemberType = require('../server/bll/user').MemberType

            const res = await user.createUserRequest({
                role: MemberType.Student,
            })

            const studentId = res.body
            studentId.should.gt(0)

            const createCompanionsResult = await user.createUserRequest({
                role: MemberType.Companion,
                name: 'Cool',
            })

            const companionId = createCompanionsResult.body
            companionId.should.gt(0)

            const start = moment().add('h', 3).set('minutes', 30).set('seconds', 0)
            const end = moment().add('h', 5).set('minutes', 0).set('seconds', 0)
            const createGroupResponse = await common.makeRequest('post', '/api/v1/class-schedule', {
                students: [studentId],
                companions: [companionId],
                status: 'opened',
                start_time: start,
                end_time: end,
            })

            const classId = createGroupResponse.body.class_id
            classId.should.gt(0)

            const getClassResponse = await common.makeRequest('get', `/api/v2/class-schedule/${classId}`)
            getClassResponse.body.class_id.should.eql(classId)
            getClassResponse.body.status.should.eql('opened')
            getClassResponse.body.students.should.eql(String(studentId))

            const queryResponse = await common.makeRequest('get', `${PATH}/${studentId}`)
            queryResponse.body.length.should.gt(0)
            queryResponse.body[0].companion_id.should.eql(String(companionId))
            queryResponse.body[0].companion_name.should.eql('Cool')
        })
    })
})
