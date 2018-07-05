exports.up = function (knex, Promise) {
    return knex.schema.table('banner', table => {
        table.string('position')
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.table('banner', table => {
        table.dropColumn('position')
    })
}
