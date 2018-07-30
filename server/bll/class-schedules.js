import ClassScheduleDAL from '../dal/class-schedules'

const classHours = require('./class-hours')

module.exports = {
    async removeStudents(trx, userIds, classId) {
        await trx('student_class_schedule')
            .where('user_id', 'in', userIds)
            .andWhere({ class_id: classId })
            .del()

        const classHoursOfClass = await ClassScheduleDAL.getClassHours(classId)

        await Promise.all(userIds.map(userId => classHours.charge(trx, userId, classHoursOfClass, `cancelled booking for class id = ${classId}`)))
    },

    async addStudents(trx, studentSchedules, classId) {
        const data = studentSchedules.map(s => {
            s.class_id = classId
            return s
        })

        await trx('student_class_schedule')
            .insert(data)

        const classHoursOfClass = await ClassScheduleDAL.getClassHours(classId)

        await Promise.all(studentSchedules.map(s => classHours.consume(trx, s.user_id, classHoursOfClass, `booked a class id = ${classId}`)))
    },

    validateClass(classData) {
        const classStartTime = new Date(classData.start_time)
        const now = new Date()

        if (now > classStartTime) {
            throw new Error('课程开始时间不应该在过去')
        }
    },

    async saveSubscribers(trx, subscribers, classId) {
        if (subscribers.length) {
            await ClassScheduleDAL.removeAllSubscribers(trx, classId)
            await ClassScheduleDAL.addSubscribers(trx, subscribers, classId)
        }
    },

    async getSubscribers(classId) {
        return await ClassScheduleDAL.getSubscribers(classId)
    },
}
