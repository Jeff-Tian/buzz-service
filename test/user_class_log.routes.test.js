const _ = require('lodash')
const moment = require('moment-timezone')
const queryString = require('query-string')
const timeHelper = require('../server/common/time-helper')
const common = require('./test-helpers/common')
const PATH = '/api/v1/userClassLog'

const { server, should, chai, knex } = require('./test-helpers/prepare')
describe('用户班级行为路由', () => {
    beforeEach(async () => {
        await knex.migrate.latest()
        await knex.seed.run()
    })

    afterEach(async () => {
        await knex.migrate.rollback()
        // await server.close()
    })

    describe('用户班级行为记录', () => {
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
        it('用户班级行为记录: 点击上课', async () => {
            const res = await common.makeRequest('post', `${PATH}`, {
                type: 'attend',
                user_id: companionIds[0],
                class_id: classIds[0],
            })
            res.body.user_class_log_id.should.eql(1)
        })
        it('用户班级行为记录: 修改', async () => {
            await common.makeRequest('post', `${PATH}`, {
                type: 'attend',
                user_id: companionIds[0],
                class_id: classIds[0],
            })
            const res = await common.makeRequest('post', `${PATH}`, {
                user_class_log_id: 1,
                type: 'attend',
                user_id: 1,
                class_id: 1,
            })
            res.body.user_id.should.eql(1)
            res.body.class_id.should.eql(1)
        })
        it('用户班级行为列表', async () => {
            await common.makeRequest('post', `${PATH}`, {
                type: 'attend',
                user_id: companionIds[0],
                class_id: classIds[0],
            })
            const res = await common.makeRequest('get', `${PATH}?${queryString.stringify({
                class_id: classIds[0],
            })}`)
            res.body[0].class_id.should.eql(classIds[0])
        })
    })
})
