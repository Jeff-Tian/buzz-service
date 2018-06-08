import chai from 'chai'
import Tags from '../../server/bll/tags'

const should = chai.should()

describe('System user tags tests', () => {
    it('检测标签数组里是否含有系统用户标签', () => {
        Tags.containsSystemUserTags(['a', 'b']).should.eql(false)
        Tags.containsSystemUserTags(['超级管理员']).should.eql(true)
    })

    it('不允许未登录用户修改系统用户标签', () => {
        const context = {}

        should.throw(() => Tags.checkHttpContext(context, ['超级管理员']))
    })
})
