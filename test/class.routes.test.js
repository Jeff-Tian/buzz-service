const common = require('./test-helpers/common')
const PATH = '/api/v1/class-schedule'

const { server, should, chai, knex } = require('./test-helpers/prepare')
// Rollback, commit and populate the test database before each test
describe('routes: class schedules', () => {
    beforeEach(async () => {
        await knex.migrate.latest()
        await knex.seed.run()
    })

    afterEach(async () => {
        await knex.migrate.rollback()
        // await server.close()
    })

    // Here comes the first test
    describe(`GET ${PATH}/suggested-classes`, () => {
        it('should return all the suggested class schedules for ', async () => {
            try {
                const res = await common.makeRequest('get', `${PATH}/suggested-classes?time_range_start=2018-1-1`)
                res.status.should.eql(200)
                res.type.should.eql('application/json')
                res.body.length.should.eql(3)
                res.body[0].should.include.keys('user_id', 'status')
            } catch (err) {
                console.error(err)
                should.not.exist(err)
            }
        })
    })

    describe(`POST ${PATH}`, () => {
        it('should create a class and then update it without error', async () => {
            const createClassResponse = await common.makeRequest('post', `${PATH}`, {
                adviser_id: 1,
                companions: [4, 5, 6],
                level: 'aa',
                start_time: '2029-03-02T10:00:00Z',
                end_time: '2029-03-02T11:00:00Z',
                status: 'opened',
                name: 'Test class',
                remark: 'xxx',
                topic: 'animal',
                students: [1, 2, 3],
                exercises: '["yyy","zzz"]',
                room_url: 'http://www.baidu.com',
            })

            createClassResponse.status.should.eql(201)
            createClassResponse.type.should.eql('application/json')
            createClassResponse.body.adviser_id.should.eql(1)
            createClassResponse.body.end_time.should.eql('2029-03-02T11:00:00Z')
            createClassResponse.body.name.should.eql('Test class')
            createClassResponse.body.start_time.should.eql('2029-03-02T10:00:00Z')
            createClassResponse.body.status.should.eql('opened')
            createClassResponse.body.topic.should.eql('animal')
            createClassResponse.body.class_id.should.gt(0)
            const classId = createClassResponse.body.class_id
            classId.should.gt(0)
            console.log('classId ===================>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ', classId)

            const searchStudentClassScheduleResponse = await common.makeRequest('get', '/api/v1/student-class-schedule')

            searchStudentClassScheduleResponse.status.should.eql(200)
            searchStudentClassScheduleResponse.type.should.eql('application/json')
            searchStudentClassScheduleResponse.body.length.should.gt(3)

            const studentClassSchedules = searchStudentClassScheduleResponse.body.length

            const searchCompanionClassScheduleResponse = await common.makeRequest('get', '/api/v1/companion-class-schedule')
            searchCompanionClassScheduleResponse.status.should.eql(200)
            searchCompanionClassScheduleResponse.type.should.eql('application/json')
            searchCompanionClassScheduleResponse.body.length.should.gt(3)

            const companionClassSchedules = searchCompanionClassScheduleResponse.body.length

            try {
                const updateClassResponse = await common.makeRequest('post', `${PATH}`, {
                    class_id: classId,
                    adviser_id: 1,
                    companions: [],
                    start_time: '2029-03-02T10:00:00Z',
                    end_time: '2029-03-02T11:00:00Z',
                    status: 'opened',
                    name: 'Test class',
                    remark: 'xxx',
                    topic: 'animal',
                    students: [],
                    exercises: '["yyy","zzz"]',
                    room_url: 'http://www.baidu.com',
                })

                updateClassResponse.status.should.eql(200)
            } catch (ex) {
                should.not.exist(ex)
            }

            const searchStudentClassScheduleAgainResponse = await common.makeRequest('get', '/api/v1/student-class-schedule')

            searchStudentClassScheduleAgainResponse.body.length.should.eql(studentClassSchedules - 3)

            const res = await common.makeRequest('get', '/api/v1/companion-class-schedule')
            res.body.length.should.eql(companionClassSchedules - 3)
        })

        it('should allow remove all students from a class', async () => {
            const createClassResponse = await common.makeRequest('post', `${PATH}`, {
                adviser_id: 1,
                companions: [4, 5, 6],
                level: 'aa',
                start_time: '2029-03-02T10:00:00Z',
                end_time: '2029-03-02T11:00:00Z',
                status: 'opened',
                name: 'Test class',
                remark: 'xxx',
                topic: 'animal',
                students: [1, 2, 3],
                exercises: '["yyy","zzz"]',
                room_url: 'http://www.baidu.com',
            })

            createClassResponse.status.should.eql(201)
            createClassResponse.type.should.eql('application/json')
            const classId = createClassResponse.body.class_id

            const res = await common.makeRequest('post', `${PATH}`, {
                class_id: classId,
                end_time: '2029-03-02T11:00:00Z',
                students: [],
            })

            res.status.should.eql(200)
            res.type.should.eql('application/json')
            should.not.exist(res.body.students)
        })
    })
    describe('Class Schedule Update', () => {
        it('should allow change students in a class without changing companion', async () => {
            const createClassResponse = await common.makeRequest('post', `${PATH}`, {
                adviser_id: 1,
                companions: [4, 5, 6],
                level: 'aa',
                start_time: '2029-03-02T10:00:00Z',
                end_time: '2029-03-30T16:53:00Z',
                status: 'opened',
                name: 'Test class',
                remark: 'xxx',
                topic: 'animal',
                students: [1, 2, 3],
                exercises: '["yyy","zzz"]',
                room_url: 'http://www.baidu.com',
            })

            createClassResponse.status.should.eql(201)
            createClassResponse.type.should.eql('application/json')
            const classId = createClassResponse.body.class_id

            const updateGroupResponse = await common.makeRequest('post', `${PATH}`, {
                class_id: classId,
                end_time: '2029-03-30T16:53:00Z',
                students: [3, 8, 9],
            })

            updateGroupResponse.status.should.eql(200)
            updateGroupResponse.type.should.eql('application/json')
            updateGroupResponse.body.students.should.eql('3,8,9')
        })
    })

    describe('查询班级列表', () => {
        it('按状态筛选', async () => {
            let res = await common.makeRequest('get', `${PATH}?statuses=opened&statuses=ended`)
            res.status.should.eql(200)
            res.body.length.should.eql(2)

            res = await common.makeRequest('get', `${PATH}?statuses=ended`)
            res.status.should.eql(200)
            res.body.length.should.eql(1)
        })
    })

    describe('创建开始时间在之前的班级应该报错', () => {
        it('创建开始时间在之前的班级应该报错', async () => {
            try {
                const createClassResponse = await common.makeRequest('post', `${PATH}`, {
                    adviser_id: 1,
                    companions: [4, 5, 6],
                    level: 'aa',
                    start_time: '2018-03-02T10:00:00Z',
                    end_time: '2018-03-02T11:00:00Z',
                    status: 'opened',
                    name: 'Test class',
                    remark: 'xxx',
                    topic: 'animal',
                    students: [1, 2, 3],
                    exercises: '["yyy","zzz"]',
                    room_url: 'http://www.baidu.com',
                })

                createClassResponse.status.should.eql(400)
            } catch (ex) {
                should.exist(ex)
            }
        })
    })
})
