import Redis from '../bll/redis'

export default class RedisController {
    static async get(ctx, next) {
        ctx.body = { [ctx.params.key]: await Redis.get(ctx.params.key) }
    }

    static async set(ctx, next) {
        ctx.body = { result: await Redis.set(ctx.params.key, ctx.request.body[ctx.params.key]) }
    }
}
