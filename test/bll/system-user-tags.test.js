import chai from 'chai'
import Tags, { OnlySuperUserCanManageSystemUserTagsError } from '../../server/bll/tags'
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

    beforeEach(async () => {
        await knex.migrate.rollback()
        await knex.migrate.latest()
        await knex.seed.run()
    })

    afterEach(async () => {
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

        const newUserId = (await userHelper.createUserRequest({
            name: 'super user',
        })).body

        try {
            await userBll.addTags(newUserId, [SystemUserTags.Admin], context)
        } catch (ex) {
            should.not.exist(ex)
        }

        try {
            await userBll.addTags(newUserId, [SystemUserTags.Super], context)
        } catch (e) {
            should.exist(e)
        }
    })

    it('超级管理员可以管理所有标签', async () => {
        const context = {
            state: {
                user: {
                    user_id: 1,
                },
            },
        }

        await userBll.addTags(1, [SystemUserTags.Super], context)
        try {
            await userBll.addTags(2, [SystemUserTags.Super], context)
            await userBll.deleteTags(2, [SystemUserTags.Super], context)
            await userBll.addTags(2, [SystemUserTags.Admin], context)
            await userBll.addTags(2, ['whatever'], context)
        } catch (ex) {
            should.not.exist(ex)
        }
    })

    it('系统管理员不能管理超级管理员标签和系统管理员标签', async () => {
        const context = {
            state: {
                user: {
                    user_id: 1,
                },
            },
        }

        await userBll.addTags(1, [SystemUserTags.Super], context)
        await userBll.addTags(2, [SystemUserTags.Admin], context)

        let user3Tags = await userBll.getTags(3)

        context.state.user.user_id = 2
        try {
            await userBll.addTags(3, [SystemUserTags.Super], context)

            user3Tags = await userBll.getTags(3)
        } catch (ex) {
            should.exist(ex)
        }

        try {
            await userBll.addTags(3, [SystemUserTags.Admin], context)

            const tags = await userBll.getTags(3)
            tags.length.should.eql(user3Tags.length)
        } catch (ex) {
            should.equal(true, ex instanceof OnlySuperUserCanManageSystemUserTagsError)
            should.exist(ex)
        }

        try {
            await userBll.addTags(3, ['whatever'], context)
        } catch (e) {
            should.not.exist(e)
        }
    })

    it('判断用户是不是系统使用者', async () => {
        const context = {
            state: {
                user: {
                    user_id: 1,
                },
            },
        }
        should.equal(await userBll.isSystemUsers(1), false)
        await userBll.addTags(1, [SystemUserTags.Super], context)
        should.equal(await userBll.isSystemUsers(1), true)
        await userBll.deleteTags(1, [SystemUserTags.Super], context)
        await userBll.addTags(1, [SystemUserTags.Admin], context)
        should.equal(await userBll.isSystemUsers(1), true)
    })
})
