import * as userBookings from './test-data-generators/user-bookings'

const common = require('./test-helpers/common')
const { server, should, chai, knex } = require('./test-helpers/prepare')
const PATH = '/api/v1/users'
const userBll = require('../server/bll/user')

describe('routes: users', () => {
    before(async () => {
        await knex.migrate.rollback()
        await knex.migrate.latest()
        await knex.seed.run()
    })

    after(async () => {
        await knex.migrate.rollback()
    })

    // Here comes the first test
    describe(`GET ${PATH}`, () => {
        it('should return all the users', async () => {
            const res = await common.makeRequest('get', `${PATH}`)

            res.status.should.eql(200)
            res.type.should.eql('application/json')
            res.body.length.should.eql(5)
            res.body[0].should.include.keys('user_id', 'name', 'created_at', 'role', 'avatar', 'facebook_id', 'wechat_data', 'class_hours')
        })
    })

    describe(`GET ${PATH}?role=s`, () => {
        it('should return all the students', done => {
            chai
                .request(server)
                .get(`${PATH}?role=s`)
                .end((err, res) => {
                    should.not.exist(err)
                    res.status.should.eql(200)
                    res.type.should.eql('application/json')
                    res.body.length.should.eql(2)
                    res.body[0].should.include.keys('user_id', 'name', 'created_at', 'role', 'avatar', 'facebook_id', 'wechat_data', 'country', 'city')
                    done()
                })
        })

        it('should allow search by mobile', done => {
            chai
                .request(server)
                .get(`${PATH}?mobile=17717373367`)
                .end((err, res) => {
                    should.not.exist(err)
                    res.status.should.eql(200)
                    res.type.should.eql('application/json')
                    res.body.length.should.eql(1)
                    res.body[0].should.include.keys('user_id', 'name', 'created_at', 'role', 'avatar', 'facebook_id', 'wechat_data')
                    done()
                })
        })

        it('should allow search by email', done => {
            chai
                .request(server)
                .get(`${PATH}?email=jie.tian@hotmail.com`)
                .end((err, res) => {
                    should.not.exist(err)
                    res.status.should.eql(200)
                    res.type.should.eql('application/json')
                    res.body.length.should.eql(1)
                    res.body[0].should.include.keys('user_id', 'name', 'created_at', 'role', 'avatar', 'facebook_id', 'wechat_data')
                    done()
                })
        })

        it('should allow search by wechat name', done => {
            chai
                .request(server)
                .get(`${PATH}?wechat_name=xx`)
                .end((err, res) => {
                    should.not.exist(err)
                    res.status.should.eql(200)
                    res.type.should.eql('application/json')
                    res.body.length.should.eql(1)
                    res.body[0].should.include.keys('user_id', 'name', 'created_at', 'role', 'avatar', 'facebook_id', 'wechat_data')
                    done()
                })
        })

        it('should allow search by display_name', done => {
            chai
                .request(server)
                .get(`${PATH}?display_name=zzzz`)
                .end((err, res) => {
                    should.not.exist(err)
                    res.status.should.eql(200)
                    res.type.should.eql('application/json')
                    res.body.length.should.eql(0)
                    done()
                })
        })
    })

    describe(`GET ${PATH}/:user_id`, () => {
        it('should return a single user', done => {
            chai
                .request(server)
                .get(`${PATH}/1`)
                .end((err, res) => {
                    should.not.exist(err)
                    res.status.should.eql(200)
                    res.type.should.eql('application/json')
                    res.body.should.include.keys('user_id', 'name', 'created_at', 'role', 'avatar', 'facebook_id', 'wechat_data', 'level')
                    res.body.level.should.eql('A')
                    done()
                })
        })
        it('should return an error when the requested user does not exists', done => {
            chai
                .request(server)
                .get(`${PATH}/9999`)
                .end((err, res) => {
                    should.exist(err)
                    res.status.should.eql(404)
                    res.type.should.eql('application/json')
                    res.body.error.should.eql('The requested user does not exists')
                    done()
                })
        })
    })
    describe(`POST ${PATH}`, () => {
        it('should return the newly added user identifier alongside a Location header', done => {
            chai
                .request(server)
                .post(`${PATH}`)
                .send({
                    facebook_id: '12345678',
                    facebook_name: 'John Doe',
                    role: 's',
                    name: 'John Doe',
                    user_id: '99',
                    wechat_name: 'xxx yyy',
                })
                .end((err, res) => {
                    should.not.exist(err)
                    res.status.should.eql(201)
                    res.should.have.header('Location')
                    res.type.should.eql('application/json')
                    res.body.should.be.a('number')

                    chai
                        .request(server)
                        .get(`${PATH}/${res.body}`)
                        .end((err, res) => {
                            should.not.exist(err)
                            res.status.should.eql(200)
                            res.type.should.eql('application/json')
                            res.body.should.include.keys('user_id', 'name', 'created_at', 'role', 'avatar', 'facebook_id', 'wechat_data')
                            res.body.wechat_name.should.eql('xxx yyy')

                            chai.request(server)
                                .post(`${PATH}/`)
                                .send({
                                    facebook_id: '12345678',
                                    facebook_name: 'Trying to add a user with the same facebook_id',
                                    role: 's',
                                    name: 'John Doe',
                                    user_id: 20,
                                })
                                .end((err, res) => {
                                    should.exist(err)
                                    done()
                                })
                        })
                })
        })
        it('should return an error when the resource already exists', done => {
            chai
                .request(server)
                .post(`${PATH}`)
                .send({
                    name: 'user1',
                    user_id: '1',
                })
                .end((err, res) => {
                    should.exist(err)
                    res.status.should.eql(409)
                    res.type.should.eql('application/json')
                    res.body.error.should.eql('The user already exists')
                    done()
                })
        })
    })

    describe(`GET ${PATH}/by-facebook/:facebook_id`, () => {
        it('should find user by facebook id', done => {
            chai
                .request(server)
                .get(`${PATH}/by-facebook/12345`)
                .end((err, res) => {
                    should.not.exist(err)
                    res.status.should.eql(200)
                    res.type.should.eql('application/json')
                    done()
                })
        })
    })

    describe(`GET ${PATH}/by-wechat`, () => {
        it('should find user by wechat open id', done => {
            chai
                .request(server)
                .get(`${PATH}/by-wechat?openid=oyjHGw_XuFegDeFmObyFh0uTnHXI`)
                .end((err, res) => {
                    should.not.exist(err)
                    res.status.should.eql(200)
                    res.type.should.eql('application/json')
                    done()
                })
        })

        it('should find user by wechat union id', done => {
            chai.request(server)
                .get(`${PATH}/by-wechat?unionid=12345`)
                .end((err, res) => {
                    should.not.exist(err)
                    res.status.should.eql(200)
                    res.type.should.eql('application/json')
                    done()
                })
        })
    })

    describe(`PUT ${PATH}/sign-in`, () => {
        it('should not allow empty info log in', done => {
            chai.request(server)
                .put(`${PATH}/sign-in`)
                .send({})
                .end((err, res) => {
                    should.exist(err)
                    res.status.should.eql(403)
                    done()
                })
        })

        it('should not sign in a non-exist user', done => {
            chai.request(server)
                .put(`${PATH}/sign-in`)
                .send({ user_id: 999 })
                .end((err, res) => {
                    should.exist(err)
                    res.status.should.eql(404)
                    done()
                })
        })

        it('should sign in a facebook user', done => {
            chai.request(server)
                .put(`${PATH}/sign-in`)
                .send({
                    user_id: 1,
                    facebook_id: 12345,
                })
                .end((err, res) => {
                    should.not.exist(err)
                    res.status.should.eql(200)
                    res.type.should.eql('application/json')
                    should.exist(res.headers['set-cookie'])
                    res.headers['set-cookie'][0].indexOf('user_id').should.eql(0)
                    done()
                })
        })
    })
    describe(`PUT ${PATH}/sign-in-byMobileOrEmail`, () => {
        it('should hint mobile or email is empty', done => {
            chai.request(server)
                .put(`${PATH}/sign-in-byMobileOrEmail`)
                .send()
                .end((err, res) => {
                    should.exist(err)
                    res.status.should.eql(403)
                    done()
                })
        })
        it('should hint the requested user does not exists', done => {
            chai.request(server)
                .put(`${PATH}/sign-in-byMobileOrEmail`)
                .send({
                    mobile: '1771737336',
                    password: '123',
                })
                .end((err, res) => {
                    should.exist(err)
                    res.status.should.eql(404)
                    done()
                })
        })

        it('should hint the requested user does not exists', done => {
            chai.request(server)
                .put(`${PATH}/sign-in-byMobileOrEmail`)
                .send({
                    email: 'jie.tian@hotmail',
                    password: '123',
                })
                .end((err, res) => {
                    should.exist(err)
                    res.status.should.eql(404)
                    done()
                })
        })

        it('should hint Account or password error', done => {
            chai.request(server)
                .put(`${PATH}/sign-in-byMobileOrEmail`)
                .send({
                    mobile: '17717373367',
                    password: '1',
                })
                .end((err, res) => {
                    should.exist(err)
                    res.status.should.eql(403)
                    done()
                })
        })
        it('should hint Account or password error', done => {
            chai.request(server)
                .put(`${PATH}/sign-in-byMobileOrEmail`)
                .send({
                    email: 'jie.tian@hotmail.com',
                    password: '1',
                })
                .end((err, res) => {
                    should.exist(err)
                    res.status.should.eql(403)
                    done()
                })
        })

        it('should hint login successful', done => {
            chai.request(server)
                .put(`${PATH}/sign-in-byMobileOrEmail`)
                .send({
                    mobile: '17717373367',
                    password: '123',
                })
                .end((err, res) => {
                    res.status.should.eql(200)
                    done()
                })
        })
        it('should hint login successful', done => {
            chai.request(server)
                .put(`${PATH}/sign-in-byMobileOrEmail`)
                .send({
                    email: 'jie.tian@hotmail.com',
                    password: '123',
                })
                .end((err, res) => {
                    res.status.should.eql(200)
                    done()
                })
        })
    })

    describe(`PUT ${PATH}/:user_id`, () => {
        it('should update a user', done => {
            chai.request(server)
                .put(`${PATH}/2`)
                .send({
                    name: 'changed',
                    country: '美国',
                    display_name: 'changed',
                    facebook_name: 'changed',
                    interests: ['business', 'art'],
                    remark: 'test',
                })
                .end((err, res) => {
                    should.not.exist(err)
                    res.status.should.eql(200)

                    res.body.country.should.eql('美国')
                    res.body.remark.should.eql('test')

                    chai.request(server)
                        .get(`${PATH}/2`)
                        .end((err, res) => {
                            should.not.exist(err)

                            res.status.should.eql(200)
                            res.body.name.should.eql('changed')
                            res.body.display_name.should.eql('changed')
                            res.body.facebook_name.should.eql('changed')
                            res.body.interests.should.eql('art,business')
                            res.body.country.should.eql('美国')
                            res.body.remark.should.eql('test')

                            chai.request(server)
                                .put(`${PATH}/2`)
                                .send({ interests: ['business', 'art'] })
                                .end((err, res) => {
                                    should.not.exist(err)
                                    res.body.interests.should.eql('art,business')

                                    done()
                                })
                        })
                })
        })
    })

    describe(`POST ${PATH}/byUserIdlist`, () => {
        it('通过一个userId数组，查询出user_id对应的avatar', done => {
            chai
                .request(server)
                .post(`${PATH}/byUserIdlist`)
                .send({
                    userIdList: [1, 2, 3],
                    /* userIdList: [4, 5, 6], */
                })
                .end((err, res) => {
                    should.not.exist(err)
                    done()
                })
        })
    })

    describe(`DEL ${PATH}/:user_id`, () => {
        it('should throw error when trying to delete a non-exist user', done => {
            chai.request(server)
                .del(`${PATH}/251`)
                .end((err, res) => {
                    should.exist(err)
                    done()
                })
        })
    })

    describe(`GET ${PATH}/feedback/:class_id`, () => {
        it('通过class_id查出学生评价所需信息', done => {
            chai
                .request(server)
                .get(`${PATH}/feedback/1`)
                .end((err, res) => {
                    should.not.exist(err)
                    res.body.userInfo[0].should.include.keys('userId', 'userName', 'avatar', 'score')
                    res.body.class_id.should.eql('1')
                    done()
                })
        })
    })

    async function createUserWithNameAndRole(username, userType) {
        const createUserResponse = await common.makeRequest('post', '/api/v1/users', {
            name: username,
            role: userType,
        })

        createUserResponse.status.should.eql(201)
        const userId = createUserResponse.body
        return userId
    }

    async function createUserWithProfileIncomplete(username, userType) {
        const userId = await createUserWithNameAndRole(username, userType)

        userId.should.gt(0)

        const result = await common.makeRequest('get', `${PATH}/is-profile-ok/${userId}`)
        result.status.should.eql(200)
        result.body.should.eql(false)
    }

    describe(`GET ${PATH}/is-profile-ok/:user_id`, () => {
        it('如果外籍学生的邮箱没填，那么资料是不完整的', async () => {
            await createUserWithProfileIncomplete('student without mobile', userBll.MemberType.Companion)
        })

        it('如果中方学生的手机号没填，那么资料是不完整的', async () => {
            await createUserWithProfileIncomplete('companion without email', userBll.MemberType.Student)
        })
    })

    describe(`PUT ${PATH}/:user_id`, () => {
        it('如果用户已经被排过课，则不能切换角色', async () => {
            try {
                const changeRoleResponse = await common.makeRequest('put', `${PATH}/4`, {
                    role: userBll.MemberType.Student,
                })
            } catch (ex) {
                should.exist(ex)
                ex.status.should.eql(400)
                ex.response.text.should.eql(`The user 4 has confirmed groups so can't change role to ${userBll.MemberType.Student} from ${userBll.MemberType.Companion}`)

                try {
                    await common.makeRequest('put', `${PATH}/4`, {
                        role: userBll.MemberType.Companion,
                    })
                } catch (ex) {
                    should.not.exist(ex)
                }
            }

            const newUser = await userBll.get(4)
            newUser.role.should.eql(userBll.MemberType.Companion)
        })

        it('如果用户没有被排过课，则可以切换角色', async () => {
            try {
                const userId = await createUserWithNameAndRole('user without groups', userBll.MemberType.Companion)

                try {
                    await common.makeRequest('put', `${PATH}/${userId}`, {
                        role: userBll.MemberType.Student,
                    })
                } catch (ex) {
                    should.not.exist(ex)
                }

                const newUser = await userBll.get(userId)
                newUser.role.should.eql(userBll.MemberType.Student)
            } catch (ex) {
                should.not.exist(ex)
            }
        })

        it('如果用户切换角色，则时区设置会被清空', async () => {
            const userId = await createUserWithNameAndRole('companion with timezone settings', userBll.MemberType.Companion)

            await common.makeRequest('put', `${PATH}/${userId}`, {
                time_zone: 'Asia/Samarkand',
            })

            const newUser = await userBll.get(userId)
            newUser.time_zone.should.eql('Asia/Samarkand')

            try {
                await common.makeRequest('put', `${PATH}/${userId}`, {
                    role: userBll.MemberType.Student,
                })
            } catch (ex) {
                should.not.exist(ex)
            }

            const roleChangedUser = await userBll.get(userId)
            should.not.exist(roleChangedUser.time_zone)
        })
    })
})
