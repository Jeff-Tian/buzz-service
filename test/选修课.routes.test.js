const _ = require('lodash')
const moment = require('moment-timezone')
const queryString = require('query-string')
const timeHelper = require('../server/common/time-helper')
const common = require('./test-helpers/common')
const PATH = '/api/v1/class-schedule'

const {server, should, chai, knex} = require('./test-helpers/prepare')
// Rollback, commit and populate the test database before each test
describe('选修课', () => {
    beforeEach(async () => {
        await knex.migrate.latest()
        await knex.seed.run()
    })

    afterEach(async () => {
        await knex.migrate.rollback()
        // await server.close()
    })

    describe('选修课查询', () => {
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
            (await common.makeRequest('get', `${PATH}/optional?${queryString.stringify({
                user_id: currentUserId,
                date: moment().add(1, 'd').toISOString()
            })}`)).body.length.should.eql(0)
            await common.makeRequest('put', `/api/v1/users/${classmateIds[0]}`, {
                grade: 7,
            });
            (await common.makeRequest('get', `${PATH}/optional?${queryString.stringify({
                user_id: currentUserId,
                date: moment().add(1, 'd').toISOString()
            })}`)).body.length.should.eql(0)
            await common.makeRequest('put', `/api/v1/users/${classmateIds[0]}`, {
                grade: null,
            })
            await common.makeRequest('put', `/api/v1/users/${classmateIds[1]}`, {
                grade: null,
            });
            (await common.makeRequest('get', `${PATH}/optional?${queryString.stringify({
                user_id: currentUserId,
                date: moment().add(1, 'd').toISOString()
            })}`)).body.length.should.eql(0)
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
            const listRes = await common.makeRequest('get', `${PATH}/optional?${queryString.stringify({
                user_id: currentUserId,
                date: moment().add(1, 'd').toISOString()
            })}`)
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
            const listRes = await common.makeRequest('get', `${PATH}/optional?${queryString.stringify({
                user_id: currentUserId,
                date: moment().add(1, 'd').toISOString()
            })}`)
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
            const listRes = await common.makeRequest('get', `${PATH}/optional?${queryString.stringify({
                user_id: currentUserId,
                date: moment().add(1, 'd').toISOString()
            })}`)
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
            const listRes = await common.makeRequest('get', `${PATH}/optional?${queryString.stringify({
                user_id: currentUserId,
                date: moment().add(1, 'd').toISOString()
            })}`)
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
            const listRes = await common.makeRequest('get', `${PATH}/optional?${queryString.stringify({
                user_id: currentUserId,
                date: moment().add(1, 'd').toISOString()
            })}`)
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
            const listRes = await common.makeRequest('get', `${PATH}/optional?${queryString.stringify({
                user_id: currentUserId,
                date: moment().add(1, 'd').toISOString()
            })}`)
            listRes.body.length.should.eql(0)
        })
        it('选修课列表: 开始时间不符合', async () => {
            const listRes = await common.makeRequest('get', `${PATH}/optional?${queryString.stringify({
                user_id: currentUserId,
                date: moment().add(1, 'd').add(1, 'h').toISOString()
            })}`)
            listRes.body.length.should.eql(0)
        })
        it('选修课列表: 水平不一致不推荐', async () => {
            await common.makeRequest('put', `/api/v1/users/${classmateIds[0]}`, {
                grade: 2,
            });
            (await common.makeRequest('get', `${PATH}/optional?${queryString.stringify({
                user_id: currentUserId,
                date: moment().add(1, 'd').toISOString()
            })}`)).body[0].recommend.should.equal(true)
            await common.makeRequest('put', `/api/v1/users/${classmateIds[1]}`, {
                grade: 6,
            });
            (await common.makeRequest('get', `${PATH}/optional?${queryString.stringify({
                user_id: currentUserId,
                date: moment().add(1, 'd').toISOString()
            })}`)).body[0].recommend.should.equal(false)
        })
        it('选修课列表: 年级不符且无老教学方时不推荐', async () => {
            await common.makeRequest('put', `/api/v1/users/${classmateIds[0]}`, {
                grade: 2,
            })
            await common.makeRequest('put', `/api/v1/users/${classmateIds[1]}`, {
                grade: 6,
            })
            const listRes = await common.makeRequest('get', `${PATH}/optional?${queryString.stringify({
                user_id: currentUserId,
                date: moment().add(1, 'd').toISOString()
            })}`)
            listRes.body.length.should.eql(1)
            listRes.body[0].class_id.should.eql(classIds[0])
            listRes.body[0].recommend.should.equal(false)
        })
        it('选修课列表: 年级不符且有老教学方时有推荐', async () => {
            await common.makeRequest('put', `/api/v1/users/${classmateIds[0]}`, {
                grade: 2,
            })
            await common.makeRequest('put', `/api/v1/users/${classmateIds[1]}`, {
                grade: 6,
            })
            await common.makeRequest('put', `/api/v1/user-balance/${currentUserId}`, {
                class_hours: 1,
            })
            await common.makeRequest('post', '/api/v1/class-schedule', {
                companions: [companionIds[0]],
                start_time: timeHelper.convertToDBFormat(moment().add(10, 'd').add(2, 'h').toISOString()),
                end_time: timeHelper.convertToDBFormat(moment().add(10, 'd').add(2, 'h').add(25, 'm').toISOString()),
                status: 'ended',
                module: '模块2',
                topic: '主题2',
                topic_level: '主题级别2',
                students: [...classmateIds, currentUserId],
                level: '等级2',
                name: '名称2',
                class_hours: 1,
                allow_sign_up: true,
            })
            const listRes = await common.makeRequest('get', `${PATH}/optional?${queryString.stringify({
                user_id: currentUserId,
                date: moment().add(1, 'd').toISOString()
            })}`)
            listRes.body.length.should.eql(1)
            listRes.body[0].class_id.should.eql(classIds[0])
            listRes.body[0].recommend.should.equal(true)
        })
        // it('选修课列表: 推荐', async () => {
        //     await common.makeRequest('post', '/api/v1/class-schedule', {
        //         class_id: classIds[0],
        //         students: classmateIds,
        //         companions: [companionIds[0]],
        //         start_time: timeHelper.convertToDBFormat(moment().add(1, 'd').add(2, 'h').toISOString()),
        //         end_time: timeHelper.convertToDBFormat(moment().add(1, 'd').add(2, 'h').add(25, 'm').toISOString()),
        //         status: 'cancelled',
        //         module: '模块1',
        //         topic: '主题1',
        //         topic_level: '主题级别1',
        //         level: '等级1',
        //         name: '名称1',
        //         class_hours: 1,
        //         allow_sign_up: false,
        //     })
        //     const listRes = await common.makeRequest('get', `${PATH}/optional?${queryString.stringify({ user_id: currentUserId, date: moment().add(1, 'd').toISOString() })}`)
        //     listRes.body.length.should.eql(0)
        // })
        it('选修课列表: 正常', async () => {
            const listRes = await common.makeRequest('get', `${PATH}/optional?${queryString.stringify({
                user_id: currentUserId,
                date: moment().add(1, 'd').toISOString()
            })}`)
            listRes.body.length.should.eql(1)
            listRes.body[0].class_id.should.eql(classIds[0])
            listRes.body[0].recommend.should.equal(true)
        })
        it('参加选修课: 不可参加', async () => {
            try {
                const listRes = await common.makeRequest('post', `${PATH}/joinOptional/${classIds[0]}?${queryString.stringify({user_id: currentUserId})}`)
                console.log(listRes.body)
            } catch (err) {
                console.error(err)
                should.exist(err)
            }
        })
        it('参加选修课: 可参加', async () => {
            await common.makeRequest('put', `/api/v1/user-balance/${currentUserId}`, {
                class_hours: 1,
            })
            const listRes = await common.makeRequest('post', `${PATH}/joinOptional/${classIds[0]}?${queryString.stringify({user_id: currentUserId})}`)
            listRes.body.students.split(',').map(_.toNumber).should.include(currentUserId)
        })
        it('选修课详情: 无法参加', async () => {
            try {
                let listRes = await common.makeRequest('get', `${PATH}/optional?${queryString.stringify({
                    user_id: currentUserId,
                    date: moment().add(1, 'd').toISOString()
                })}`)
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
                await common.makeRequest('get', `${PATH}/optional/${classIds[0]}?${queryString.stringify({
                    user_id: currentUserId,
                    check_class_hours: true
                })}`)
            } catch (err) {
                console.error(err)
                should.exist(err)
            }
            await common.makeRequest('put', `/api/v1/user-balance/${currentUserId}`, {
                class_hours: 1,
            })
            const listRes = await common.makeRequest('get', `${PATH}/optional/${classIds[0]}?${queryString.stringify({
                user_id: currentUserId,
                check_class_hours: true
            })}`)
            listRes.body.length.should.eql(1)
            listRes.body[0].class_id.should.eql(classIds[0])
        })
        it('选修课详情: 正常', async () => {
            const listRes = await common.makeRequest('get', `${PATH}/optional/${classIds[0]}?${queryString.stringify({user_id: currentUserId})}`)
            listRes.body.length.should.eql(1)
            listRes.body[0].class_id.should.eql(classIds[0])
        })
    })
})
