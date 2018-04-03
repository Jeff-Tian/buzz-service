exports.up = function (knex, Promise) {
    return knex.schema.table('user_profiles', table => {
        table.string('school_name')
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.table('user_profiles', table => {
        table.dropColumn('school_name')
    })
}
