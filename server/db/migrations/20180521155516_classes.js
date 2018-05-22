exports.up = function (knex, Promise) {
    return knex.schema.table('classes', table => {
        table.text('module')
        table.text('topic_level')
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.table('classes', table => {
        table.dropColumn('module')
        table.dropColumn('topic_level')
    })
}
