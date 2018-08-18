exports.up = function (knex, Promise) {
    return knex.schema.createTable('user_states', table => {
        table.bigInteger('user_id').unsigned().notNullable()
        table.enum('state', ['potential', 'lead', 'demo', 'waiting_purchase', 'in_class', 'waiting_renewal', 'invalid'])
        table.timestamp('timestamp').defaultTo(knex.fn.now())
        table.text('remark')

        table.foreign('user_id').references('users.user_id').onDelete('CASCADE').onUpdate('CASCADE')
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.dropTable('user_states')
}
