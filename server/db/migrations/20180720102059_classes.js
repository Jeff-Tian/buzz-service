exports.up = function (knex, Promise) {
    return knex.schema.table('classes', table => {
        table.decimal('class_hours').defaultTo(1)
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.table('classes', table => {
        table.dropColumn('class_hours')
    })
}
