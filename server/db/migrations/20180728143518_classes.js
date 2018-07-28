exports.up = function (knex, Promise) {
    return knex.schema.table('classes', table => {
        table.boolean('allow_sign_up').defaultTo(true)
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.table('classes', table => {
        table.dropColumn('allow_sign_up')
    })
}
