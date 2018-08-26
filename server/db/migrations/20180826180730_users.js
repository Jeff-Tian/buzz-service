exports.up = function (knex, Promise) {
    return knex.schema.table('users', table => {
        table.text('follower')
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.table('users', table => {
        table.dropColumn('follower')
    })
}
