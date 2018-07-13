exports.up = function (knex, Promise) {
    return knex.schema.table('faq', table => {
        table.dropColumn('content')
        table.text('content', 'longtext')
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.table('faq', table => {
        table.dropColumn('content')
        table.text('content')
    })
}
