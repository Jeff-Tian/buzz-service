exports.up = function (knex, Promise) {
    return knex.schema.table('user_profiles', table => {
        table.boolean('intro_done').defaultTo(false)
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.table('user_profiles', table => {
        table.dropColumn('intro_done')
    })
}
