const config = require('../../server/config/index')
const chai = require('chai')
const should = chai.should()

describe('config test', () => {
    it('should return development config', () => {
        config.endPoints.bullService.should.eql('http://localhost:16222')
    })
})
