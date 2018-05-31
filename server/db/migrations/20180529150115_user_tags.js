exports.up = function (knex, Promise) {
    return knex.schema.createTable('user_tags', table => {
        table.bigInteger('user_id')
        table.string('tag')
        table.timestamp('created_at').defaultTo(knex.fn.now())

        table.primary(['user_id', 'tag'])
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.dropTable('user_tags')
}
