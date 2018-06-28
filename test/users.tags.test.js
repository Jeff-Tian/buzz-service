import * as userBookings from './test-data-generators/user-bookings'
import * as classHours from '../server/bll/class-hours'
import { UserTags, NeedChargeThreshold, ClassStatusCode } from '../server/common/constants'

const common = require('./test-helpers/common')
const { server, should, chai, knex } = require('./test-helpers/prepare')
const PATH = '/api/v1/users'
const userBll = require('../server/bll/user')
const userHelper = require('./test-helpers/user')

describe('routes: users', () => {
    before(async () => {
        await knex.migrate.rollback()
        await knex.migrate.latest()
        await knex.seed.run()
    })

    after(async () => {
        await knex.migrate.rollback()
    })

    describe('自动给用户打标签的场景', () => {
        it('新注册的学生账号自动打上 leads 标签，充课时后自动移除', async () => {
            const userId = (await userHelper.createUserRequest({
                name: 'leads example',
                role: userBll.MemberType.Student,
            })).body

            let userDetail = await userBll.get(userId)
            userDetail.tags.should.eql(UserTags.Leads)

            await classHours.charge(null, userId, 1)
            userDetail = await userBll.get(userId)
            userDetail.tags.indexOf(UserTags.Leads).should.lt(0)
            userDetail.tags.should.eql(UserTags.NeedCharge)

            await classHours.charge(null, userId, 10)
            userDetail = await userBll.get(userId)
            should.equal(userDetail.tags, null)
        })

        it('新注册的外籍语伴账号不会被打上 leads 标签', async () => {
            const userId = (await userHelper.createUserRequest({
                name: 'not leads',
                role: userBll.MemberType.Companion,
            })).body
            const userDetail = await userBll.get(userId)
            should.equal(userDetail.tags, null)
        })

        it('当用户课时数发生变化，如果余额小于等于 2，自动添加上 "需续费" 标签。当余额大于 2 时，自动移除 "需续费" 标签。', async () => {
            const userId = (await userHelper.createUserRequest({
                name: 'new User',
                role: userBll.MemberType.Student,
            })).body

            await classHours.charge(null, userId, 10)
            let userDetail = await userBll.get(userId)
            should.equal(userDetail.tags, null)

            await classHours.consume(null, userId, 9)
            userDetail = await userBll.get(userId)
            should.equal(userDetail.tags, UserTags.NeedCharge)

            await classHours.charge(null, userId, 2)
            userDetail = await userBll.get(userId)
            should.equal(userDetail.tags, null)
        })

        it(`Alice 买单 ${NeedChargeThreshold + 1} 个课时，当被排进班级小组时，不会被打上“需续费”标签`, async () => {
            const userId = (await userHelper.createUserRequest({
                name: 'Alice',
                role: userBll.MemberType.Student,
            })).body

            await classHours.charge(null, userId, NeedChargeThreshold + 1)
            let userDetail = await userBll.get(userId)
            should.equal(userDetail.tags, null)

            let startTime = new Date(2018, 12, 1, 9, 0, 0)
            let endTime = new Date(2018, 12, 1, 10, 0, 0)
            let classInfo = (await common.makeRequest('post', '/api/v1/class-schedule', {
                level: 'A',
                start_time: startTime,
                end_time: endTime,
                status: ClassStatusCode.Open,
                name: 'Test Class',
                remark: 'no remark',
                topic: 'a fake class',
                students: [userId],
            })).body

            userDetail = await userBll.get(userId)
            should.equal(userDetail.tags, null)

            await common.makeRequest('put', `/api/v1/class-schedule/${classInfo.class_id}`)

            userDetail = await userBll.get(userId)
            should.equal(userDetail.tags, null)

            startTime = new Date(2018, 12, 2, 9, 0, 0)
            endTime = new Date(2018, 12, 2, 10, 0, 0)
            classInfo = (await common.makeRequest('post', '/api/v1/class-schedule', {
                level: 'A',
                start_time: startTime,
                end_time: endTime,
                status: ClassStatusCode.Open,
                name: 'Test Class again',
                remark: 'no remark',
                topic: 'a fake class',
                students: [userId],
            })).body

            userDetail = await userBll.get(userId)
            should.equal(userDetail.tags, null)
        })
    })
})
