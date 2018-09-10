exports.up = function (knex, Promise) {
    return knex.schema.table('student_class_schedule', table => {
        table.string('remark')
        if (process.env.NODE_ENV !== 'test') {
            table.dropForeign('user_id')
        }
        table.dropUnique(['user_id', 'start_time', 'status'])
        table.unique(['user_id', 'start_time', 'status', 'remark'])
        // table.raw('ADD KEY `student_class_schedule_user_id_start_time_status_remark`(`user_id`,`start_time`,`status`,`remark`(100)) USING BTREE')
        if (process.env.NODE_ENV !== 'test') {
            table.foreign('user_id').references('users.user_id').onDelete('CASCADE').onUpdate('CASCADE')
        }
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.table('student_class_schedule', table => {
        table.dropColumn('remark')
        if (process.env.NODE_ENV !== 'test') {
            table.dropForeign('user_id')
            table.dropUnique(['user_id', 'start_time', 'status', 'remark'])
        }
        table.unique(['user_id', 'start_time', 'status'])
        if (process.env.NODE_ENV !== 'test') {
            table.foreign('user_id').references('users.user_id').onDelete('CASCADE').onUpdate('CASCADE')
        }
    })
}
