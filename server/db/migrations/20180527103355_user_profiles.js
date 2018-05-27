exports.up = function (knex, Promise) {
    return knex.schema.table('user_profiles', table => {
        table.string('youzan_mobile')
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.table('user_profiles', table => {
        table.dropColumn('youzan_mobile')
    })
}
