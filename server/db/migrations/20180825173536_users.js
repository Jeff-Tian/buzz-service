exports.up = function (knex, Promise) {
    return knex.schema.table('users', table => {
        table.text('source')
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.table('users', table => {
        table.dropColumn('source')
    })
}
