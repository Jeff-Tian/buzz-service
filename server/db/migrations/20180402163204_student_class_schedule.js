
exports.up = function (knex, Promise) {
    return knex.schema.table('student_class_schedule', table => {
        table.biginteger('batch_id').unsigned().nullable()
    }).then(() => knex.schema.alterTable('student_class_schedule', table => {
        table.unique(['user_id', 'batch_id'])
    }))
}

exports.down = function (knex, Promise) {
    return knex.schema.table('student_class_schedule', table => {
        table.dropColumn('batch_id')
    }).then(() => knex.schema.table('student_class_schedule', table => {
        table.dropUnique(['user_id', 'batch_id'])
    }))
}
