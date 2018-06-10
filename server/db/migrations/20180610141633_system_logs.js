exports.up = function (knex, Promise) {
    return knex.schema.createTable('system_logs', table => {
        table.bigIncrements('event_id')
        table.bigInteger('user_id').unsigned()
        table.text('remark')
        table.timestamp('at').defaultTo(knex.fn.now())

        table.foreign('user_id').references('users.user_id').onDelete('CASCADE').onUpdate('CASCADE')
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.dropTable('system_logs')
}
