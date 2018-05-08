const env = process.env.NODE_ENV || 'test'
const config = require('../../knexfile')[env]
const knex = require('knex')(config)
const _ = require('lodash')

const GroupStatus = {
    Confirmed: 'confirmed',
}

export default class ClassScheduleDAL {
    static async hasConfirmedClassSchedules(userId) {
        function searchConfirmedClassSchedulesFrom(table) {
            return knex
                .select('class_id')
                .from(table)
                .where('user_id', '=', userId)
                .andWhere('status', '=', GroupStatus.Confirmed)
        }

        return await searchConfirmedClassSchedulesFrom('student_class_schedule').unionAll(searchConfirmedClassSchedulesFrom('companion_class_schedule'))
    }
}
