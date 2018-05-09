exports.up = function (knex, Promise) {
    return knex.schema.table('user_profiles', table => {
        table.text('order_remark')
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.table('user_profiles', table => {
        table.dropColumn('order_remark')
    })
}
