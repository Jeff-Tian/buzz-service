import logger from '../common/logger'

const env = process.env.NODE_ENV || 'test'
const config = require('../../knexfile')[env]
const knex = require('knex')(config)
const pkg = require('../../package.json')
const buzzConfig = require('../config')

const healthCheck = async ctx => {
    const state = {
        everything: 'is ok',
        env,
        version: pkg.version,
    }

    const cookieOptions = {
        httpOnly: true,
        expires: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)),
    }

    if (buzzConfig.rootDomain) {
        cookieOptions.domain = buzzConfig.rootDomain
    }

    ctx.cookies.set('cookie-test', 'test value', cookieOptions)

    ctx.body = state
}
module.exports = { healthCheck }
