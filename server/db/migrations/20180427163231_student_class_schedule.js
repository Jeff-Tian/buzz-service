exports.up = function (knex, Promise) {
    return knex.schema.table('student_class_schedule', table => {
        table.dropUnique(['user_id', 'batch_id', 'start_time'])
        table.unique(['user_id', 'start_time', 'status'])
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.table('student_class_schedule', table => {
        table.dropUnique(['user_id', 'start_time', 'status'])
        table.unique(['user_id', 'batch_id', 'start_time'])
    })
}
