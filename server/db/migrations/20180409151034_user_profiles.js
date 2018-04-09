exports.up = function (knex, Promise) {
    return knex.schema.table('user_profiles', table => {
        table.string('time_zone')
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.table('user_profiles', table => {
        table.dropColumn('time_zone')
    })
}
