exports.up = function (knex, Promise) {
    return knex.schema.table('companion_class_schedule', table => {
        if (process.env.NODE_ENV !== 'test') {
            try {
                table.dropForeign('user_id')
            } catch (ex) {
            }
        }
        table.dropUnique(['user_id', 'batch_id', 'start_time'])
        table.unique(['user_id', 'start_time', 'status'])
        if (process.env.NODE_ENV !== 'test') {
            table.foreign('user_id').references('users.user_id').onDelete('CASCADE').onUpdate('CASCADE')
        }
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.table('companion_class_schedule', table => {
        if (process.env.NODE_ENV !== 'test') {
            table.dropForeign('user_id')
        }
        table.dropUnique(['user_id', 'start_time', 'status'])
        table.unique(['user_id', 'batch_id', 'start_time'])
        if (process.env.NODE_ENV !== 'test') {
            table.foreign('user_id').references('users.user_id').onDelete('CASCADE').onUpdate('CASCADE')
        }
    })
}
