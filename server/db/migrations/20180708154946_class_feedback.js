exports.up = function (knex, Promise) {
    return knex.schema.table('class_feedback', table => {
        table.string('type')
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.table('class_feedback', table => {
        table.dropColumn('type')
    })
}
