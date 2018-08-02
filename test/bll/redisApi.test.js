import Redis from '../../server/bll/redis'

const chai = require('chai')
chai.should()

describe('redis', () => {
    it('可以存储和取值', async () => {
        const isOK = await Redis.set('foo', 'bar')
        isOK.should.be.a('string')
        isOK.should.equal('OK')

        const bar = await Redis.get('foo')
        bar.should.equal('bar')
    })
})
