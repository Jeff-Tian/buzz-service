exports.up = function (knex, Promise) {
    return knex.schema.table('content', table => {
        table.text('companion_notice', 'longtext')
        table.text('student_notice', 'longtext')
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.table('content', table => {
        table.dropColumn('companion_notice')
        table.dropColumn('student_notice')
    })
}
