exports.up = function (knex, Promise) {
    return knex.schema.table('banner', table => {
        table.string('img_url_tablet')
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.table('banner', table => {
        table.dropColumn('img_url_tablet')
    })
}
