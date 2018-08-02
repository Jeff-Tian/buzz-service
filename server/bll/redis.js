import { redis } from '../common/redis'

export default class Redis {
    static async get(key) {
        return await redis.get(key)
    }

    static async set(key, value) {
        return (await redis.set(key, value))
    }
}
