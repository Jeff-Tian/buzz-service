exports.up = function (knex, Promise) {
    return knex.schema.table('user_profiles', table => {
        table.boolean('mobile_confirmed').defaultTo(false)
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.table('user_profiles', table => {
        table.dropColumn('mobile_confirmed')
    })
}
