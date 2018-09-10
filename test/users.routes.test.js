import { UserStates } from '../server/bll/user-state'
const _ = require('lodash')
const common = require('./test-helpers/common')
const { server, should, chai, knex } = require('./test-helpers/prepare')
const PATH = '/api/v1/users'
const userBll = require('../server/bll/user')

describe('routes: users', () => {
    async function createUserWithNameAndRole(username, userType) {
        const createUserResponse = await common.makeRequest('post', '/api/v1/users', {
            name: username,
            role: userType,
        }, null, 'user_id=1')

        createUserResponse.status.should.eql(201)
        return createUserResponse.body
    }

    async function createUserWithProfileIncomplete(username, userType) {
        const userId = await createUserWithNameAndRole(username, userType)

        userId.should.gt(0)

        const result = await common.makeRequest('get', `${PATH}/is-profile-ok/${userId}`)
        result.status.should.eql(200)
        result.body.should.eql(false)
    }

    before(async () => {
        // await knex.migrate.rollback()
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

        it('should should return the first 2 users', async () => {
            const res = await common.makeRequest('get', `${PATH}?per_page=2&current_page=1&tags=`)

            res.status.should.eql(200)
            res.body.data.length.should.eql(2)
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
        it('外籍注册成功自动添加一课时', async () => {
            const userId = await createUserWithNameAndRole('new tutor with 1 class hour', userBll.MemberType.Companion)

            const newUser = await userBll.get(userId)
            newUser.class_hours.should.eql(1)
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
    describe(`PUT ${PATH}/account-sign-in`, () => {
        it('should hint mobile or email is empty', done => {
            chai.request(server)
                .put(`${PATH}/account-sign-in`)
                .send()
                .end((err, res) => {
                    should.exist(err)
                    res.status.should.eql(403)
                    done()
                })
        })
        it('should hint the requested user does not exists', done => {
            chai.request(server)
                .put(`${PATH}/account-sign-in`)
                .send({
                    account: '1771737336',
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
                .put(`${PATH}/account-sign-in`)
                .send({
                    account: 'jie.tian@hotmail',
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
                .put(`${PATH}/account-sign-in`)
                .send({
                    account: '17717373367',
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
                .put(`${PATH}/account-sign-in`)
                .send({
                    account: 'jie.tian@hotmail.com',
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
                .put(`${PATH}/account-sign-in`)
                .send({
                    account: '17717373367',
                    password: '123',
                })
                .end((err, res) => {
                    res.status.should.eql(200)
                    done()
                })
        })
        it('should hint login successful', done => {
            chai.request(server)
                .put(`${PATH}/account-sign-in`)
                .send({
                    account: 'jie.tian@hotmail.com',
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
                    console.log('=============================================')
                    console.error(err)
                    console.log(res)
                    console.log('--------------------------------------------')
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
                            res.body.interests.should.eql('business,art')
                            res.body.country.should.eql('美国')
                            res.body.remark.should.eql('test')

                            chai.request(server)
                                .put(`${PATH}/2`)
                                .send({ interests: ['business', 'art'] })
                                .end((err, res) => {
                                    should.not.exist(err)
                                    res.body.interests.should.eql('business,art')

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
                }, null, 'user_id=1')
            } catch (ex) {
                should.exist(ex)
                ex.status.should.eql(400)
                ex.response.text.substr(0, 64).should.eql(`The user 4 has confirmed groups so can't change role to ${userBll.MemberType.Student} from ${userBll.MemberType.Companion}`)

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
            }, null, 'user_id=1')

            const newUser = await userBll.get(userId)
            newUser.time_zone.should.eql('Asia/Samarkand')

            try {
                await common.makeRequest('put', `${PATH}/${userId}`, {
                    role: userBll.MemberType.Student,
                }, null, 'user_id=1')
            } catch (ex) {
                should.not.exist(ex)
            }

            const roleChangedUser = await userBll.get(userId)
            should.not.exist(roleChangedUser.time_zone)
        })

        it('用户社交账号资料', async () => {
            const res = await common.makeRequest('post', '/api/v1/users', {
                name: 'test wechat',
                role: 's',
                wechat_openid: 'xxx',
                wechat_unionid: 'yyy',
            }, null, 'user_id=1')

            const userId = res.body

            userId.should.gt(0)

            const socialAccountRes = await common.makeRequest('get', `/api/v1/users/social-account-profile/${userId}`)
            socialAccountRes.body.should.include.keys('wechat_openid', 'wechat_unionid')
            socialAccountRes.body.wechat_openid.should.eql('xxx')
        })

        it('多个账号绑定同一手机号登录', async () => {
            const userId1 = (await common.makeRequest('post', '/api/v1/users', {
                name: 'user1',
                role: 's',
                mobile: '18888888888',
                password: 'hahaha',
            })).body

            const res = await common.makeRequest('put', `/api/v1/users/${userId1}`, {
                password: 'hahaha',
            }, { user: 'buzz', pass: 'pass' })

            const userId2 = (await common.makeRequest('post', '/api/v1/users', {
                name: 'user2',
                role: 's',
                mobile: '18888888888',
                password: 'hahaha',
            })).body

            await common.makeRequest('put', `/api/v1/users/${userId2}`, {
                password: 'hahaha',
            }, { user: 'buzz', pass: 'pass' })

            try {
                const loginResponse = (await common.makeRequest('put', '/api/v1/users/account-sign-in', {
                    account: '18888888888',
                    password: 'hahaha',
                    user_id: null,
                }))

                console.log('response = ', loginResponse.body)
                loginResponse.body.length.should.gt(1)
            } catch (ex) {
                should.not.exist(ex)
            }
        })
    })

    describe('更新账号', () => {
        it('可以将周上课频率修改为0', async () => {
            const userId = (await common.makeRequest('post', '/api/v1/users', {
                name: 'user1',
            })).body

            let res = await common.makeRequest('put', `/api/v1/users/${userId}`, { weekly_schedule_requirements: 1 })

            res.status.should.eql(200)

            let newInfo = (await common.makeRequest('get', `/api/v1/users/${userId}`)).body
            newInfo.weekly_schedule_requirements.should.eql(1)

            res = await common.makeRequest('put', `/api/v1/users/${userId}`, { weekly_schedule_requirements: 0 })
            res.status.should.eql(200)

            newInfo = (await common.makeRequest('get', `/api/v1/users/${userId}`)).body
            newInfo.weekly_schedule_requirements.should.eql(0)
        })

        it('可以修改微信资料并且兼容特殊字符', async () => {
            const userId = (await common.makeRequest('post', '/api/v1/users', {
                name: 'user1',
            })).body

            let res = await common.makeRequest('put', `/api/v1/users/${userId}`, {
                wechat_name: '🐾笑一个',
            })

            res.status.should.eql(200)

            const newInfo = (await common.makeRequest('get', `/api/v1/users/${userId}`)).body
            newInfo.wechat_name.should.eql('🐾笑一个')

            const wechatData = {
                subscribe: 1,
                openid: 'oyjHGw8nZEiHlQsyTxGcjhCYOb0c',
                nickname: '🐾笑一个',
                sex: 2,
                language: 'zh_CN',
                city: '',
                province: '',
                country: '阿尔及利亚',
                headimgurl: 'http://thirdwx.qlogo.cn/mmopen/Q3auHgzwzM5wW5KZJM6UHMOP2NE3NNzH07zEh2DWcJxphaNYwPaGTiamCVp78NDGTIe9Lz7nFOy5fC3ExHoKDs2ck6r32VcOepW5iatNp9xqc/132',
                subscribe_time: 1533369736,
                unionid: 'o0Kee0bccvxuwxQ6Kbp9Mg4ag-cs',
                remark: '',
                groupid: 0,
                tagid_list: [],
                subscribe_scene: 'ADD_SCENE_QR_CODE',
                qr_scene: 0,
                qr_scene_str: 'youzan_qr_87',
            }
            res = await common.makeRequest('put', `/api/v1/users/${userId}`, {
                wechat_data: wechatData,
            })

            res.status.should.eql(200)
            res.body.wechat_data.should.eql(JSON.stringify(wechatData))
        })
    })
    describe('导入用户', () => {
        it('正常导入用户', async () => {
            const user = {
                wechat_name: 'wechat_name0', mobile: '18600000000', source: 'source0', grade: '1', order_remark: 'order_remark0', schedule_requirement: 'schedule_requirement0', class_hours: 1.5,
            }
            const { body: { output } } = await common.makeRequest('post', '/api/v1/users/import', {
                output_detail: true,
                type: UserStates.InClass,
                data: [user],
            })
            should.exist(_.find(output, _.omit({ ...user, order_remark: `跟进记录: ${user.order_remark}\n上课需求时间: ${user.schedule_requirement}` }, ['schedule_requirement'])))
        })
        it('正常导入用户: 存在一个账号', async () => {
            const oldUser = (await common.makeRequest('post', '/api/v1/users', {
                name: 'name1',
                role: 's',
                mobile: '18600000000',
                wechat_name: '1',
            })).body
            // console.log((await common.makeRequest('get', `/api/v1/users/${oldUser}`)).body)
            const user = {
                wechat_name: 'wechat_name0', mobile: '18600000000', source: 'source0', grade: '1', order_remark: 'order_remark0', schedule_requirement: 'schedule_requirement0', class_hours: 1.5,
            }
            const { body: { output } } = await common.makeRequest('post', '/api/v1/users/import', {
                output_detail: true,
                type: UserStates.InClass,
                data: [user],
            })
            // console.log(output)
            should.exist(_.find(output, _.omit({ ...user, order_remark: `跟进记录: ${user.order_remark}\n上课需求时间: ${user.schedule_requirement}` }, ['schedule_requirement'])))
            // console.log(_.pick(output[0], _.keys(user)), _.omit({ ...user, order_remark: `跟进记录: ${user.order_remark}\n上课需求时间: ${user.schedule_requirement}` }, ['schedule_requirement']))
            output[0].user_id.should.eql(oldUser)
        })
        it('导入用户错误: 存在多个账号', async () => {
            const oldUser = (await common.makeRequest('post', '/api/v1/users', {
                name: 'name1',
                role: 's',
                mobile: '18600000000',
            })).body
            const oldUser2 = (await common.makeRequest('post', '/api/v1/users', {
                name: 'name2',
                role: 's',
                mobile: '18600000000',
            })).body
            const user = {
                wechat_name: 'wechat_name0', mobile: '18600000000', source: 'source0', grade: '1', order_remark: 'order_remark0', schedule_requirement: 'schedule_requirement0', class_hours: 1.5,
            }
            const { body: { errors } } = await common.makeRequest('post', '/api/v1/users/import', {
                output_detail: true,
                type: UserStates.InClass,
                data: [user],
            })
            errors[0].should.eql(`${user.mobile} 存在多个账号: ${oldUser},${oldUser2}`)
        })
        it('导入用户错误: 手机号不合法', async () => {
            const user = {
                wechat_name: 'wechat_name0', mobile: '123', source: 'source0', grade: '1', order_remark: 'order_remark0', schedule_requirement: 'schedule_requirement0', class_hours: 1.5,
            }
            const { body: { error, errors } } = await common.makeRequest('post', '/api/v1/users/import', {
                output_detail: true,
                type: UserStates.InClass,
                data: [user],
            })
            errors.length.should.eql(1)
            errors[0].should.eql(`${user.mobile} 不是合法的中国手机号`)
        })
        it('导入用户错误: Leads 状态', async () => {
            const user = {
                wechat_name: 'wechat_name0', mobile: '18600000000', source: 'source0', grade: '1', order_remark: 'order_remark0', schedule_requirement: 'schedule_requirement0', class_hours: 1.5,
            }
            await common.makeRequest('post', '/api/v1/users/import', {
                output_detail: true,
                type: UserStates.Lead,
                data: [user],
            })
            const { body: { errors } } = await common.makeRequest('post', '/api/v1/users/import', {
                output_detail: true,
                type: UserStates.Lead,
                data: [user],
            })
            errors[0].should.eql(`${user.mobile} 当前状态 Leads, 不可转为 lead`)
        })
        it('导入用户错误: Demo 状态', async () => {
            const user = {
                wechat_name: 'wechat_name0', mobile: '18600000000', source: 'source0', grade: '1', order_remark: 'order_remark0', schedule_requirement: 'schedule_requirement0', class_hours: 1.5,
            }
            await common.makeRequest('post', '/api/v1/users/import', {
                output_detail: true,
                type: UserStates.Demo,
                data: [user],
            })
            const { body: { errors } } = await common.makeRequest('post', '/api/v1/users/import', {
                output_detail: true,
                type: UserStates.Lead,
                data: [user],
            })
            errors[0].should.eql(`${user.mobile} 当前状态 Demo, 不可转为 lead`)
        })
        it('导入用户错误: Buy 状态', async () => {
            const user = {
                wechat_name: 'wechat_name0', mobile: '18600000000', source: 'source0', grade: '1', order_remark: 'order_remark0', schedule_requirement: 'schedule_requirement0', class_hours: 1.5,
            }
            await common.makeRequest('post', '/api/v1/users/import', {
                output_detail: true,
                type: UserStates.WaitingForPurchase,
                data: [user],
            })
            const { body: { errors } } = await common.makeRequest('post', '/api/v1/users/import', {
                output_detail: true,
                type: UserStates.Lead,
                data: [user],
            })
            errors[0].should.eql(`${user.mobile} 当前状态 Buy, 不可转为 lead`)
        })
        it('导入用户错误: 待续费 状态', async () => {
            const user = {
                wechat_name: 'wechat_name0', mobile: '18600000000', source: 'source0', grade: '1', order_remark: 'order_remark0', schedule_requirement: 'schedule_requirement0', class_hours: 1.5,
            }
            await common.makeRequest('post', '/api/v1/users/import', {
                output_detail: true,
                type: UserStates.WaitingForRenewal,
                data: [user],
            })
            const { body: { errors } } = await common.makeRequest('post', '/api/v1/users/import', {
                output_detail: true,
                type: UserStates.Lead,
                data: [user],
            })
            errors[0].should.eql(`${user.mobile} 当前状态 待续费, 不可转为 lead`)
        })
    })
})
