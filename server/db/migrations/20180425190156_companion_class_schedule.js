exports.up = function (knex, Promise) {
    return knex.schema.table('companion_class_schedule', table => {
        table.biginteger('batch_id').unsigned().nullable()
        table.unique(['user_id', 'batch_id', 'start_time'])
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.table('companion_class_schedule', table => {
        table.dropUnique(['user_id', 'batch_id', 'start_time'])
        table.dropColumn('batch_id')
    })
}
