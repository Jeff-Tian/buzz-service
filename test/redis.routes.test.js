import chai from 'chai'
import chaiHttp from 'chai-http'

chai.should()
chai.use(chaiHttp)

const app = require('../server/index')
describe('redis routes', () => {
    it('存储和取值', async () => {
        let res = await chai.request(app)
            .post('/api/v1/redis/set/foo')
            .send({ foo: 'bar' })

        res.body.should.deep.equal({ result: 'OK' })

        res = await chai.request(app)
            .get('/api/v1/redis/get/foo')
            .send({})

        res.body.should.deep.equal({ foo: 'bar' })
    })
})
