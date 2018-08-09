exports.up = function (knex, Promise) {
    return knex.schema.table('content', table => {
        table.boolean('optional_hidden').defaultTo(false)
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.table('content', table => {
        table.dropColumn('optional_hidden')
    })
}
