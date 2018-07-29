const env = process.env.NODE_ENV || 'test'
const config = require('../../knexfile')[env]
const knex = require('knex')(config)

export default class ClassScheduleDAL {
    static async hasClassSchedules(userId) {
        function searchClassSchedulesFrom(table) {
            return knex
                .select('class_id', 'status', 'start_time', 'end_time')
                .from(table)
                .where('user_id', '=', userId)
        }

        return await searchClassSchedulesFrom('student_class_schedule').unionAll(searchClassSchedulesFrom('companion_class_schedule'))
    }

    static async removeAllSubscribers(trx, classId) {
        await trx('class_subscribers').where('class_id', classId).del()
    }

    static async addSubscribers(trx, subscribers, classId) {
        await trx('class_subscribers').insert(subscribers.map(userId => ({
            class_id: classId,
            user_id: userId,
        })))
    }

    static async getSubscribers(classId) {
        return await knex('class_subscribers')
            .select('class_id', 'user_id')
            .where('class_id', classId)
    }
}
