const env = process.env.NODE_ENV || 'test'
const config = require('../../knexfile')[env]
const knex = require('knex')(config)
const userDal = require('../../server/dal/user')
const chai = require('chai')
const should = chai.should()

describe('test dal', () => {
    before(async () => {
        await knex.migrate.rollback()
        await knex.migrate.latest()
        await knex.seed.run()
    })

    after(async () => {
        await knex.migrate.rollback()
    })

    it('delete tags', async () => {
        await userDal.addTags(1, ['test tag 1', 'test tag 2'])
        await userDal.deleteTags(1, ['test tag 2'])

        const tags = await userDal.getTags(1)

        tags.length.should.eql(1)
        tags[0].tag.should.eql('test tag 1')
    })
})
