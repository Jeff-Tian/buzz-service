exports.up = function (knex, Promise) {
    return knex.schema.createTable('class_observers', table => {
        table.bigInteger('class_id')
        table.bigInteger('use_id')
        table.timestamp('created_at').defaultTo(knex.fn.now())
        table.primary(['class_id', 'user_id'])
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.dropTable('class_observers')
}
