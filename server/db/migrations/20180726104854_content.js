exports.up = function (knex, Promise) {
    return knex.schema.table('content', table => {
        table.dropColumn('companion_notice')
        table.dropColumn('student_notice')
        table.text('companion_notice_zh', 'longtext')
        table.text('student_notice_zh', 'longtext')
        table.text('companion_notice_en', 'longtext')
        table.text('student_notice_en', 'longtext')
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.table('content', table => {
        table.text('companion_notice', 'longtext')
        table.text('student_notice', 'longtext')
        table.dropColumn('companion_notice_zh')
        table.dropColumn('student_notice_zh')
        table.dropColumn('companion_notice_en')
        table.dropColumn('student_notice_en')
    })
}
