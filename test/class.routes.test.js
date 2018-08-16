const common = require('./test-helpers/common')
const queryString = require('query-string')
const timeHelper = require('../server/common/time-helper')
const moment = require('moment-timezone')
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

    describe('班级完成后的任务', () => {
        let currentUserId
        const companionIds = []
        const classmateIds = []
        const classIds = []
        beforeEach(async () => {
            currentUserId = (await common.makeRequest('post', '/api/v1/users', {
                name: '当前学习方',
                role: 's',
                grade: 4,
            })).body
            companionIds[0] = (await common.makeRequest('post', '/api/v1/users', {
                name: '老师1',
                role: 'c',
            })).body
            companionIds[1] = (await common.makeRequest('post', '/api/v1/users', {
                name: '老师2',
                role: 'c',
            })).body
            classmateIds[0] = (await common.makeRequest('post', '/api/v1/users', {
                name: '同学1',
                role: 's',
                grade: 4,
            })).body
            classmateIds[1] = (await common.makeRequest('post', '/api/v1/users', {
                name: '同学2',
                role: 's',
                grade: 4,
            })).body
            classIds[0] = (await common.makeRequest('post', '/api/v1/class-schedule', {
                companions: [companionIds[0]],
                start_time: timeHelper.convertToDBFormat(moment().add(1, 'd').add(2, 'h').toISOString()),
                end_time: timeHelper.convertToDBFormat(moment().add(1, 'd').add(2, 'h').add(25, 'm').toISOString()),
                status: 'opened',
                module: '模块1',
                topic: '主题1',
                topic_level: '主题级别1',
                students: classmateIds,
                level: '等级1',
                name: '名称1',
                class_hours: 1,
                allow_sign_up: true,
            })).body.class_id
        })
        it('完成过任务, 应该报错', async () => {
            await common.makeRequest('post', '/api/v1/userClassLog', {
                type: 'attend',
                user_id: companionIds[0],
                class_id: classIds[0],
                created_at: moment().add(1, 'd').add(2, 'h').toDate(),
            })
            await common.makeRequest('post', `/api/v1/class-feedback/${classIds[0]}/${companionIds[0]}/evaluate/${classmateIds[0]}`, [{
                score: 5,
                comment: '',
                remark: '',
            }])
            await common.makeRequest('post', `/api/v1/class-feedback/${classIds[0]}/${companionIds[0]}/evaluate/${classmateIds[1]}`, [{
                score: 5,
                comment: '',
                remark: '',
            }])
            await common.makeRequest('post', `/api/v1/class-feedback/${classIds[0]}/${classmateIds[0]}/evaluate/${companionIds[0]}`, [{
                score: 4,
                comment: '',
                remark: '',
            }])
            await common.makeRequest('post', `${PATH}/afterEnd/${classIds[0]}`)
            await common.makeRequest('post', `${PATH}/afterEnd/${classIds[0]}`).catch(err => {
                console.error(err)
                should.exist(err)
            })
        })
        it('正常出席; 正常评价; 被评价4星以上', async () => {
            await common.makeRequest('post', '/api/v1/userClassLog', {
                type: 'attend',
                user_id: companionIds[0],
                class_id: classIds[0],
                created_at: moment().add(1, 'd').add(2, 'h').toDate(),
            })
            await common.makeRequest('post', `/api/v1/class-feedback/${classIds[0]}/${companionIds[0]}/evaluate/${classmateIds[0]}`, [{
                score: 5,
                comment: '',
                remark: '',
            }])
            await common.makeRequest('post', `/api/v1/class-feedback/${classIds[0]}/${companionIds[0]}/evaluate/${classmateIds[1]}`, [{
                score: 5,
                comment: '',
                remark: '',
            }])
            await common.makeRequest('post', `/api/v1/class-feedback/${classIds[0]}/${classmateIds[0]}/evaluate/${companionIds[0]}`, [{
                score: 4,
                comment: '',
                remark: '',
            }])
            await common.makeRequest('post', `${PATH}/afterEnd/${classIds[0]}`);
            (await common.makeRequest('get', `/api/v1/users/${companionIds[0]}`)).body.integral.should.eql(300)
            // console.log((await common.makeRequest('get', `/api/v1/class-feedback/admin-list/${classIds[0]}`)).body)
            // console.log((await common.makeRequest('get', `/api/v1/user-balance/i/${companionIds[0]}`)).body)
        })
        it('正常出席; 正常评价; 被评价4星', async () => {
            await common.makeRequest('post', '/api/v1/userClassLog', {
                type: 'attend',
                user_id: companionIds[0],
                class_id: classIds[0],
                created_at: moment().add(1, 'd').add(2, 'h').toDate(),
            })
            await common.makeRequest('post', `/api/v1/class-feedback/${classIds[0]}/${companionIds[0]}/evaluate/${classmateIds[0]}`, [{
                score: 3,
                comment: '',
                remark: '',
            }])
            await common.makeRequest('post', `/api/v1/class-feedback/${classIds[0]}/${companionIds[0]}/evaluate/${classmateIds[1]}`, [{
                score: 5,
                comment: '',
                remark: '',
            }])
            await common.makeRequest('post', `/api/v1/class-feedback/${classIds[0]}/${classmateIds[0]}/evaluate/${companionIds[0]}`, [{
                score: 3,
                comment: '',
                remark: '',
            }])
            await common.makeRequest('post', `${PATH}/afterEnd/${classIds[0]}`);
            (await common.makeRequest('get', `/api/v1/users/${companionIds[0]}`)).body.integral.should.eql(250)
        })
        it('正常出席; 没评价完; 被评价4星以上', async () => {
            await common.makeRequest('post', '/api/v1/userClassLog', {
                type: 'attend',
                user_id: companionIds[0],
                class_id: classIds[0],
                created_at: moment().add(1, 'd').add(2, 'h').toDate(),
            })
            await common.makeRequest('post', `/api/v1/class-feedback/${classIds[0]}/${companionIds[0]}/evaluate/${classmateIds[0]}`, [{
                score: 3,
                comment: '',
                remark: '',
            }])
            await common.makeRequest('post', `/api/v1/class-feedback/${classIds[0]}/${classmateIds[0]}/evaluate/${companionIds[0]}`, [{
                score: 4,
                comment: '',
                remark: '',
            }])
            await common.makeRequest('post', `${PATH}/afterEnd/${classIds[0]}`);
            (await common.makeRequest('get', `/api/v1/users/${companionIds[0]}`)).body.integral.should.eql(150)
        })
        it('正常出席; 24小时后评价; 被评价4星以上', async () => {
            await common.makeRequest('post', '/api/v1/userClassLog', {
                type: 'attend',
                user_id: companionIds[0],
                class_id: classIds[0],
                created_at: moment().add(1, 'd').add(2, 'h').toDate(),
            })
            await common.makeRequest('post', `/api/v1/class-feedback/${classIds[0]}/${companionIds[0]}/evaluate/${classmateIds[0]}`, [{
                score: 3,
                comment: '',
                remark: '',
                feedback_time: timeHelper.convertToDBFormat(moment().add(1, 'd').add(2, 'h').add(25, 'h').toISOString()),
            }])
            await common.makeRequest('post', `/api/v1/class-feedback/${classIds[0]}/${companionIds[0]}/evaluate/${classmateIds[1]}`, [{
                score: 5,
                comment: '',
                remark: '',
                feedback_time: timeHelper.convertToDBFormat(moment().add(1, 'd').add(2, 'h').add(25, 'h').toISOString()),
            }])
            await common.makeRequest('post', `/api/v1/class-feedback/${classIds[0]}/${classmateIds[0]}/evaluate/${companionIds[0]}`, [{
                score: 4,
                comment: '',
                remark: '',
            }])
            await common.makeRequest('post', `${PATH}/afterEnd/${classIds[0]}`);
            (await common.makeRequest('get', `/api/v1/users/${companionIds[0]}`)).body.integral.should.eql(150)
        })
        it('正常出席; 12小时到24小时之间评价; 被评价4星以上', async () => {
            await common.makeRequest('post', '/api/v1/userClassLog', {
                type: 'attend',
                user_id: companionIds[0],
                class_id: classIds[0],
                created_at: moment().add(1, 'd').add(2, 'h').toDate(),
            })
            await common.makeRequest('post', `/api/v1/class-feedback/${classIds[0]}/${companionIds[0]}/evaluate/${classmateIds[0]}`, [{
                score: 3,
                comment: '',
                remark: '',
                feedback_time: timeHelper.convertToDBFormat(moment().add(1, 'd').add(2, 'h').add(13, 'h').toISOString()),
            }])
            await common.makeRequest('post', `/api/v1/class-feedback/${classIds[0]}/${companionIds[0]}/evaluate/${classmateIds[1]}`, [{
                score: 5,
                comment: '',
                remark: '',
                feedback_time: timeHelper.convertToDBFormat(moment().add(1, 'd').add(2, 'h').add(13, 'h').toISOString()),
            }])
            await common.makeRequest('post', `/api/v1/class-feedback/${classIds[0]}/${classmateIds[0]}/evaluate/${companionIds[0]}`, [{
                score: 4,
                comment: '',
                remark: '',
            }])
            await common.makeRequest('post', `${PATH}/afterEnd/${classIds[0]}`);
            (await common.makeRequest('get', `/api/v1/users/${companionIds[0]}`)).body.integral.should.eql(250)
        })
        it('迟到10分钟以上; 正常评价; 被评价4星以上', async () => {
            await common.makeRequest('post', '/api/v1/userClassLog', {
                type: 'attend',
                user_id: companionIds[0],
                class_id: classIds[0],
                created_at: moment().add(1, 'd').add(2, 'h').add(11, 'm').toDate(),
            })
            await common.makeRequest('post', `/api/v1/class-feedback/${classIds[0]}/${companionIds[0]}/evaluate/${classmateIds[0]}`, [{
                score: 5,
                comment: '',
                remark: '',
            }])
            await common.makeRequest('post', `/api/v1/class-feedback/${classIds[0]}/${companionIds[0]}/evaluate/${classmateIds[1]}`, [{
                score: 5,
                comment: '',
                remark: '',
            }])
            await common.makeRequest('post', `/api/v1/class-feedback/${classIds[0]}/${classmateIds[0]}/evaluate/${companionIds[0]}`, [{
                score: 4,
                comment: '',
                remark: '',
            }])
            await common.makeRequest('post', `${PATH}/afterEnd/${classIds[0]}`);
            (await common.makeRequest('get', `/api/v1/users/${companionIds[0]}`)).body.integral.should.eql(50)
        })
        it('迟到5分钟到10分钟; 正常评价; 被评价4星以上', async () => {
            await common.makeRequest('post', '/api/v1/userClassLog', {
                type: 'attend',
                user_id: companionIds[0],
                class_id: classIds[0],
                created_at: moment().add(1, 'd').add(2, 'h').add(9, 'm').toDate(),
            })
            await common.makeRequest('post', `/api/v1/class-feedback/${classIds[0]}/${companionIds[0]}/evaluate/${classmateIds[0]}`, [{
                score: 5,
                comment: '',
                remark: '',
            }])
            await common.makeRequest('post', `/api/v1/class-feedback/${classIds[0]}/${companionIds[0]}/evaluate/${classmateIds[1]}`, [{
                score: 5,
                comment: '',
                remark: '',
            }])
            await common.makeRequest('post', `/api/v1/class-feedback/${classIds[0]}/${classmateIds[0]}/evaluate/${companionIds[0]}`, [{
                score: 4,
                comment: '',
                remark: '',
            }])
            await common.makeRequest('post', `${PATH}/afterEnd/${classIds[0]}`);
            (await common.makeRequest('get', `/api/v1/users/${companionIds[0]}`)).body.integral.should.eql(200)
        })
        it('迟到5分钟内; 正常评价; 被评价4星以上', async () => {
            await common.makeRequest('post', '/api/v1/userClassLog', {
                type: 'attend',
                user_id: companionIds[0],
                class_id: classIds[0],
                created_at: moment().add(1, 'd').add(2, 'h').add(4, 'm').toDate(),
            })
            await common.makeRequest('post', `/api/v1/class-feedback/${classIds[0]}/${companionIds[0]}/evaluate/${classmateIds[0]}`, [{
                score: 5,
                comment: '',
                remark: '',
            }])
            await common.makeRequest('post', `/api/v1/class-feedback/${classIds[0]}/${companionIds[0]}/evaluate/${classmateIds[1]}`, [{
                score: 5,
                comment: '',
                remark: '',
            }])
            await common.makeRequest('post', `/api/v1/class-feedback/${classIds[0]}/${classmateIds[0]}/evaluate/${companionIds[0]}`, [{
                score: 4,
                comment: '',
                remark: '',
            }])
            await common.makeRequest('post', `${PATH}/afterEnd/${classIds[0]}`);
            (await common.makeRequest('get', `/api/v1/users/${companionIds[0]}`)).body.integral.should.eql(250)
        })
        it('多次点击上课; 第一次迟到5分钟内; 第二次迟到5分钟到10分钟; 正常评价; 被评价4星以上', async () => {
            await common.makeRequest('post', '/api/v1/userClassLog', {
                type: 'attend',
                user_id: companionIds[0],
                class_id: classIds[0],
                created_at: moment().add(1, 'd').add(2, 'h').add(4, 'm').toDate(),
            })
            await common.makeRequest('post', '/api/v1/userClassLog', {
                type: 'attend',
                user_id: companionIds[0],
                class_id: classIds[0],
                created_at: moment().add(1, 'd').add(2, 'h').add(9, 'm').toDate(),
            })
            await common.makeRequest('post', `/api/v1/class-feedback/${classIds[0]}/${companionIds[0]}/evaluate/${classmateIds[0]}`, [{
                score: 5,
                comment: '',
                remark: '',
            }])
            await common.makeRequest('post', `/api/v1/class-feedback/${classIds[0]}/${companionIds[0]}/evaluate/${classmateIds[1]}`, [{
                score: 5,
                comment: '',
                remark: '',
            }])
            await common.makeRequest('post', `/api/v1/class-feedback/${classIds[0]}/${classmateIds[0]}/evaluate/${companionIds[0]}`, [{
                score: 4,
                comment: '',
                remark: '',
            }])
            await common.makeRequest('post', `${PATH}/afterEnd/${classIds[0]}`);
            (await common.makeRequest('get', `/api/v1/users/${companionIds[0]}`)).body.integral.should.eql(250)
        })
    })
})
