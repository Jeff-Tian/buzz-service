import logger from './common/logger'

const Koa = require('koa')
const redis = require('./common/redis')
const mobileCommon = require('./common/mobile')
const bodyParser = require('koa-bodyparser')
require('./common/knex')
const fs = require('fs')
const path = require('path')

const app = new Koa()
const PORT = process.env.PORT || 16888

app.use(async (ctx, next) => {
    try {
        await next()
    } catch (err) {
        console.error(err)
        logger.error(err)
        ctx.status = err.statusCode || err.status || 500
        ctx.body = err.message
    }
})

app.use(async (ctx, next) => {
    async function reportAnonymousAccess() {
        if (ctx.request.url !== '/api/v1/monitors/health-check') {
            logger.info(`anonymous user accessing ${ctx.request.url}`)
        }

        await next()
    }

    if (!ctx.cookies) {
        return await reportAnonymousAccess()
    }

    const userId = ctx.cookies.get('user_id')

    if (Number(userId) <= 0) {
        return await reportAnonymousAccess()
    }

    ctx.state.user = {
        user_id: userId,
    }

    await next()
})

app.use(bodyParser())
app.use(mobileCommon.normalizeMiddleware)

fs.readdirSync(path.join(__dirname, './routes')).forEach(file => {
    const fileFullPath = path.join(__dirname, './routes', file)
    const r = require(fileFullPath)
    app.use(r.routes())
})

const server = app.listen(PORT, async () => {
    logger.info('Buzz-Service 启动完毕。')
})

app.on('error', err => {
    logger.error(err)
})

app.on('close', () => {
    redis.redis.disconnect()
    logger.info('Buzz-Service 关闭了。')
})

module.exports = server
