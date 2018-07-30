exports.up = function (knex, Promise) {
    return knex.schema.table('content', table => {
        table.dropUnique(['module', 'topic', 'level', 'topic_level'])
        table.dropColumn('level')
        table.unique(['module', 'topic', 'topic_level'])
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.table('content', table => {
        table.dropUnique(['module', 'topic', 'topic_level'])
    }).catch(e => {}).then(() => knex.schema.table('content', table => {
        table.string('level')
        table.unique(['module', 'topic', 'level', 'topic_level'])
    }))
}
