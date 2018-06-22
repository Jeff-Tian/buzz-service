const env = process.env.NODE_ENV || 'test'
const config = require('../../knexfile')[env]
const knex = require('knex')(config)
const _ = require('lodash')

export default class ClassScheduleDAL {
    static async hasClassSchedules(userId) {
        function searchClassSchedulesFrom(table) {
            return knex
                .select('class_id', 'status')
                .from(table)
                .where('user_id', '=', userId)
        }

        return await searchClassSchedulesFrom('student_class_schedule').unionAll(searchClassSchedulesFrom('companion_class_schedule'))
    }
}
