exports.up = function (knex, Promise) {
    return knex.schema.table('classes', table => {
        table.boolean('notification_disabled').defaultTo(false)
        table.boolean('evaluate_disabled').defaultTo(false)
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.table('classes', table => {
        table.dropColumn('notification_disabled')
        table.dropColumn('evaluate_disabled')
    })
}
