exports.up = function (knex, Promise) {
    return knex.schema.table('user_tags', table => {
        table.text('remark')
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.table('user_tags', table => {
        table.dropColumn('remark')
    })
}
