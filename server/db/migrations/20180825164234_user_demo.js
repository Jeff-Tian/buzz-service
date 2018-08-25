exports.up = function (knex, Promise) {
    return knex.schema.createTable('user_demo', table => {
        table.bigInteger('user_id').unsigned().notNullable()
        table.timestamp('training_time').defaultTo(knex.fn.now())
        table.timestamp('demo_time').defaultTo(knex.fn.now())

        table.foreign('user_id').references('users.user_id').onDelete('CASCADE').onUpdate('CASCADE')
        table.primary('user_id')
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.dropTable('user_demo')
}
