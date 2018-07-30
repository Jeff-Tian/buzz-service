const _ = require('lodash')
const moment = require('moment-timezone')
const queryString = require('query-string')
const timeHelper = require('../server/common/time-helper')
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

    describe('选修课', () => {
        let currentUserId
        const companionIds = []
        const classmateIds = []
        const classIds = []
        beforeEach(async () => {
            currentUserId = (await common.makeRequest('post', '/api/v1/users', {
                name: '当前选课用户',
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
        it('选修课列表: 水平相似不符合', async () => {
            await common.makeRequest('put', `/api/v1/users/${classmateIds[0]}`, {
                grade: 1,
            });
            (await common.makeRequest('get', `${PATH}/optional?${queryString.stringify({ user_id: currentUserId, date: moment().add(1, 'd').toISOString() })}`)).body.length.should.eql(0)
            await common.makeRequest('put', `/api/v1/users/${classmateIds[0]}`, {
                grade: 7,
            });
            (await common.makeRequest('get', `${PATH}/optional?${queryString.stringify({ user_id: currentUserId, date: moment().add(1, 'd').toISOString() })}`)).body.length.should.eql(0)
            await common.makeRequest('put', `/api/v1/users/${classmateIds[0]}`, {
                grade: null,
            })
            await common.makeRequest('put', `/api/v1/users/${classmateIds[1]}`, {
                grade: null,
            });
            (await common.makeRequest('get', `${PATH}/optional?${queryString.stringify({ user_id: currentUserId, date: moment().add(1, 'd').toISOString() })}`)).body.length.should.eql(0)
        })
        it('选修课列表: 班级人数不符合', async () => {
            await common.makeRequest('post', '/api/v1/class-schedule', {
                class_id: classIds[0],
                students: [...classmateIds, 1],
                companions: [companionIds[0]],
                start_time: timeHelper.convertToDBFormat(moment().add(1, 'd').add(2, 'h').toISOString()),
                end_time: timeHelper.convertToDBFormat(moment().add(1, 'd').add(2, 'h').add(25, 'm').toISOString()),
                status: 'opened',
                module: '模块1',
                topic: '主题1',
                topic_level: '主题级别1',
                level: '等级1',
                name: '名称1',
                class_hours: 1,
                allow_sign_up: true,
            })
            const listRes = await common.makeRequest('get', `${PATH}/optional?${queryString.stringify({ user_id: currentUserId, date: moment().add(1, 'd').toISOString() })}`)
            listRes.body.length.should.eql(0)
        })
        it('选修课列表: 上过的模块主题级别', async () => {
            await common.makeRequest('post', '/api/v1/class-schedule', {
                companions: [companionIds[0]],
                start_time: timeHelper.convertToDBFormat(moment().add(2, 'd').add(2, 'h').toISOString()),
                end_time: timeHelper.convertToDBFormat(moment().add(2, 'd').add(2, 'h').add(25, 'm').toISOString()),
                status: 'ended',
                module: '模块1',
                topic: '主题1',
                topic_level: '主题级别1',
                students: [...classmateIds, currentUserId],
                level: '等级1',
                name: '名称1',
                class_hours: 1,
                allow_sign_up: true,
            })
            const listRes = await common.makeRequest('get', `${PATH}/optional?${queryString.stringify({ user_id: currentUserId, date: moment().add(1, 'd').toISOString() })}`)
            listRes.body.length.should.eql(0)
        })
        it('选修课列表: 课程时间重叠', async () => {
            await common.makeRequest('post', '/api/v1/class-schedule', {
                companions: [companionIds[1]],
                start_time: timeHelper.convertToDBFormat(moment().add(1, 'd').add(2, 'h').toISOString()),
                end_time: timeHelper.convertToDBFormat(moment().add(1, 'd').add(2, 'h').add(25, 'm').toISOString()),
                status: 'ended',
                module: '模块1',
                topic: '主题1',
                topic_level: '主题级别1',
                students: [currentUserId],
                level: '等级1',
                name: '名称1',
                class_hours: 1,
                allow_sign_up: true,
            })
            const listRes = await common.makeRequest('get', `${PATH}/optional?${queryString.stringify({ user_id: currentUserId, date: moment().add(1, 'd').toISOString() })}`)
            listRes.body.length.should.eql(0)
        })
        it('选修课列表: 班级状态不符合', async () => {
            await common.makeRequest('post', '/api/v1/class-schedule', {
                class_id: classIds[0],
                students: classmateIds,
                companions: [companionIds[0]],
                start_time: timeHelper.convertToDBFormat(moment().add(1, 'd').add(2, 'h').toISOString()),
                end_time: timeHelper.convertToDBFormat(moment().add(1, 'd').add(2, 'h').add(25, 'm').toISOString()),
                status: 'cancelled',
                module: '模块1',
                topic: '主题1',
                topic_level: '主题级别1',
                level: '等级1',
                name: '名称1',
                class_hours: 1,
                allow_sign_up: true,
            })
            const listRes = await common.makeRequest('get', `${PATH}/optional?${queryString.stringify({ user_id: currentUserId, date: moment().add(1, 'd').toISOString() })}`)
            listRes.body.length.should.eql(0)
        })
        it('选修课列表: 班级不允许报名', async () => {
            await common.makeRequest('post', '/api/v1/class-schedule', {
                class_id: classIds[0],
                students: classmateIds,
                companions: [companionIds[0]],
                start_time: timeHelper.convertToDBFormat(moment().add(1, 'd').add(2, 'h').toISOString()),
                end_time: timeHelper.convertToDBFormat(moment().add(1, 'd').add(2, 'h').add(25, 'm').toISOString()),
                status: 'cancelled',
                module: '模块1',
                topic: '主题1',
                topic_level: '主题级别1',
                level: '等级1',
                name: '名称1',
                class_hours: 1,
                allow_sign_up: false,
            })
            const listRes = await common.makeRequest('get', `${PATH}/optional?${queryString.stringify({ user_id: currentUserId, date: moment().add(1, 'd').toISOString() })}`)
            listRes.body.length.should.eql(0)
        })
        it('选修课列表: 当前用户不在班级中', async () => {
            await common.makeRequest('post', '/api/v1/class-schedule', {
                class_id: classIds[0],
                students: [...classmateIds, currentUserId],
                companions: [companionIds[0]],
                start_time: timeHelper.convertToDBFormat(moment().add(1, 'd').add(2, 'h').toISOString()),
                end_time: timeHelper.convertToDBFormat(moment().add(1, 'd').add(2, 'h').add(25, 'm').toISOString()),
                status: 'cancelled',
                module: '模块1',
                topic: '主题1',
                topic_level: '主题级别1',
                level: '等级1',
                name: '名称1',
                class_hours: 1,
                allow_sign_up: true,
            })
            const listRes = await common.makeRequest('get', `${PATH}/optional?${queryString.stringify({ user_id: currentUserId, date: moment().add(1, 'd').toISOString() })}`)
            listRes.body.length.should.eql(0)
        })
        it('选修课列表: 开始时间不符合', async () => {
            const listRes = await common.makeRequest('get', `${PATH}/optional?${queryString.stringify({ user_id: currentUserId, date: moment().add(1, 'd').add(1, 'h').toISOString() })}`)
            listRes.body.length.should.eql(0)
        })
        it('选修课列表: 水平不一致不推荐', async () => {
            await common.makeRequest('put', `/api/v1/users/${classmateIds[0]}`, {
                grade: 2,
            });
            (await common.makeRequest('get', `${PATH}/optional?${queryString.stringify({ user_id: currentUserId, date: moment().add(1, 'd').toISOString() })}`)).body[0].recommend.should.equal(true)
            await common.makeRequest('put', `/api/v1/users/${classmateIds[1]}`, {
                grade: 6,
            });
            (await common.makeRequest('get', `${PATH}/optional?${queryString.stringify({ user_id: currentUserId, date: moment().add(1, 'd').toISOString() })}`)).body[0].recommend.should.equal(false)
        })
        it('选修课列表: 正常', async () => {
            const listRes = await common.makeRequest('get', `${PATH}/optional?${queryString.stringify({ user_id: currentUserId, date: moment().add(1, 'd').toISOString() })}`)
            listRes.body.length.should.eql(1)
            listRes.body[0].class_id.should.eql(classIds[0])
            listRes.body[0].recommend.should.equal(true)
        })
        it('选修课详情: 无法参加', async () => {
            try {
                let listRes = await common.makeRequest('get', `${PATH}/optional?${queryString.stringify({ user_id: currentUserId, date: moment().add(1, 'd').toISOString() })}`)
                listRes = await common.makeRequest('get', `${PATH}/optional/${_.chain(listRes)
                    .get('body')
                    .map('class_id')
                    .max()
                    .add(1)
                    .value()}?${queryString.stringify({
                    user_id: currentUserId,
                })}`)
            } catch (err) {
                console.error(err)
                should.exist(err)
            }
        })
        it('选修课详情: 强制检查课时', async () => {
            try {
                await common.makeRequest('put', `/api/v1/user-balance/${currentUserId}`, {
                    class_hours: 0.5,
                })
                await common.makeRequest('get', `${PATH}/optional/${classIds[0]}?${queryString.stringify({ user_id: currentUserId, check_class_hours: true })}`)
            } catch (err) {
                console.error(err)
                should.exist(err)
            }
            await common.makeRequest('put', `/api/v1/user-balance/${currentUserId}`, {
                class_hours: 1,
            })
            const listRes = await common.makeRequest('get', `${PATH}/optional/${classIds[0]}?${queryString.stringify({ user_id: currentUserId, check_class_hours: true })}`)
            listRes.body.length.should.eql(1)
            listRes.body[0].class_id.should.eql(classIds[0])
        })
        it('选修课详情: 正常', async () => {
            const listRes = await common.makeRequest('get', `${PATH}/optional/${classIds[0]}?${queryString.stringify({ user_id: currentUserId })}`)
            listRes.body.length.should.eql(1)
            listRes.body[0].class_id.should.eql(classIds[0])
        })
    })
})
