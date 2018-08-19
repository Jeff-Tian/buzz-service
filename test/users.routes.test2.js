import UserState, { UserStates } from '../server/bll/user-state'
import User from './test-helpers/user'
import * as common from './test-helpers/common'
import * as classHourBll from '../server/bll/class-hours'

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
})
