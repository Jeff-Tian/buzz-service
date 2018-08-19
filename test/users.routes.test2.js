import UserState, { UserStates } from '../server/bll/user-state'
import User from './test-helpers/user'
import * as common from './test-helpers/common'

const { server, should, chai, knex } = require('./test-helpers/prepare')
const PATH = '/api/v1/users'

describe('routes: users', () => {
    beforeEach(async () => {
        // await knex.migrate.rollback()
        await knex.migrate.latest()
        await knex.seed.run()
    })

    afterEach(async () => {
        await knex.migrate.rollback()
    })

    describe(`GET ${PATH}?role=s`, () => {
        it('列表返回 consumed_class_hours, booked_class_hours 和' +
            ' locked_class_hours', done => {
            chai
                .request(server)
                .get(`${PATH}?role=s`)
                .end((err, res) => {
                    should.not.exist(err)
                    res.status.should.eql(200)
                    res.type.should.eql('application/json')
                    res.body.length.should.eql(2)
                    res.body[0].should.include.keys('user_id', 'name', 'created_at', 'role', 'avatar', 'facebook_id', 'wechat_data', 'country', 'city', 'booked_class_hours', 'locked_class_hours', 'consumed_class_hours')
                    done()
                })
        })
    })

    describe(`GET ${PATH}/:user_id`, () => {
        it('用户详情返回 booked_class_hours 和 locked_class_hours', done => {
            chai
                .request(server)
                .get(`${PATH}/1`)
                .end((err, res) => {
                    should.not.exist(err)
                    res.status.should.eql(200)
                    res.type.should.eql('application/json')
                    res.body.should.include.keys('user_id', 'name', 'created_at', 'role', 'avatar', 'facebook_id', 'wechat_data', 'level', 'booked_class_hours', 'locked_class_hours')
                    res.body.level.should.eql('A')
                    done()
                })
        })
    })

    describe('用户状态', () => {
        it('新用户会自动进入 potential 状态', async () => {
            const userId = (await User.createUserRequest({
                name: 'hahaha',
            })).body

            userId.should.gt(0)

            const result = await UserState.getLatest(userId)
            result.state.should.eql(UserStates.Potential)
        })

        it('新注册的用户填写手机号后，会变成 Leads 状态', async () => {
            const userId = (await User.createUserRequest({ name: 'hahaha' })).body
            userId.should.gt(0)

            let result = await UserState.getLatest(userId)
            result.state.should.eql(UserStates.Potential)

            await common.makeRequest('put', `/api/v1/users/${userId}`, {
                mobile: '17717373333',
            }, { user: process.env.BASIC_NAME, pass: process.env.BASIC_PASS })
            result = await UserState.getLatest(userId)
            result.state.should.eql(UserStates.Lead)
        })
    })
})
