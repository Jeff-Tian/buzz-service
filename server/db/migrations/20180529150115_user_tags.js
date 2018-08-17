exports.up = function (knex, Promise) {
    return knex.schema.createTable('user_tags', table => {
        table.bigInteger('user_id').unsigned()
        table.string('tag', 100)
        table.timestamp('created_at').defaultTo(knex.fn.now())

        table.primary(['user_id', 'tag'])
        table.foreign('user_id').references('users.user_id').onDelete('CASCADE').onUpdate('CASCADE')
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.dropTable('user_tags')
}
