exports.up = function (knex, Promise) {
    return knex.schema.createTable('content', table => {
        table.bigIncrements('content_id')
        table.string('module', 100)
        table.string('topic', 100)
        table.string('topic_level', 100)
        table.string('level', 100)
        table.text('exercises')
        table.text('student_textbook')
        table.text('tutor_textbook')
        table.unique(['module', 'topic', 'level', 'topic_level'])
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.dropTable('content')
}
