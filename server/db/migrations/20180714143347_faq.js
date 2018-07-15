exports.up = function (knex, Promise) {
    return knex.schema.table('faq', table => {
        table.string('link')
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.table('faq', table => {
        table.dropColumn('link')
    })
}
