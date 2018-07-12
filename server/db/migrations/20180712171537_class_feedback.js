exports.up = function (knex, Promise) {
    return knex.schema.table('class_feedback', table => {
        table.dropPrimary()
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.table('class_feedback', table => {
        table.primary(['class_id', 'from_user_id', 'to_user_id', 'type'])
    })
}
