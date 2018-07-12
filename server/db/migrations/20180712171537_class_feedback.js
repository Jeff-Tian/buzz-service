exports.up = function (knex, Promise) {
    return knex.schema.table('class_feedback', table => {
        if (process.env.NODE_ENV !== 'test') {
            table.dropForeign('class_id')
            table.dropForeign('from_user_id')
            table.dropForeign('to_user_id')
            table.dropPrimary()
            table.foreign('class_id').references('classes.class_id').onDelete('CASCADE').onUpdate('CASCADE')
            table.foreign('from_user_id').references('users.user_id').onDelete('CASCADE').onUpdate('CASCADE')
            table.foreign('to_user_id').references('users.user_id').onDelete('CASCADE').onUpdate('CASCADE')
            table.primary(['class_id', 'from_user_id', 'to_user_id', 'type'])
        }
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.table('class_feedback', table => {
        if (process.env.NODE_ENV !== 'test') {
            table.dropPrimary()
            table.primary(['class_id', 'from_user_id', 'to_user_id'])
        }
    })
}
