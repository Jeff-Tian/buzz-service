import chai from 'chai'
import Tags from '../../server/bll/tags'
import { SystemUserTags } from '../../server/common/constants'
import userHelper from '../test-helpers/user'
import * as userBll from '../../server/bll/user'

const should = chai.should()

describe('System user tags tests', () => {
    it('检测标签数组里是否含有系统用户标签', () => {
        Tags.containSystemUserTags(['a', 'b']).should.eql(false)
        Tags.containSystemUserTags(['超级管理员']).should.eql(true)
    })

    it('不允许未登录用户修改系统用户标签', async () => {
        const context = {}

        try {
            await Tags.checkHttpContext(context, [SystemUserTags.Super])
        } catch (ex) {
            should.exist(ex)
        }
    })
})
describe('交互测试', () => {
    const { server, should, chai, knex } = require('../test-helpers/prepare')

    before(async () => {
        await knex.migrate.rollback()
        const v = await knex.migrate.latest()
        console.log('v = ', v)
        await knex.seed.run()
    })

    after(async () => {
        await knex.migrate.rollback()
    })

    it('如果没有系统用户，则允许登录的用户修改系统用户标签', async () => {
        const context = {
            state: {
                user: {
                    user_id: 1,
                },
            },
        }

        try {
            await Tags.checkHttpContext(context, [SystemUserTags.Admin])
        } catch (ex) {
            should.not.exist(ex)
        }
    })

    it('如果存在系统用户，则不允许登录的一般用户修改系统用户标签', async () => {
        const context = {
            state: {
                user: {
                    user_id: 1,
                },
            },
        }

        const createUserResponse = await userHelper.createUserRequest({
            name: 'super user',
        })

        createUserResponse.status.should.eql(201)
        const userId = createUserResponse.body
        userId.should.gt(0)

        try {
            await userBll.addTags(userId, [SystemUserTags.Admin], context)
        } catch (ex) {
            should.not.exist(ex)
        }

        try {
            await userBll.addTags(userId, [SystemUserTags.Super], context)
        } catch (e) {
            should.exist(e)
        }
    })
})
