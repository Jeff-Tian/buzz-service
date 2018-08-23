exports.up = function (knex, Promise) {
    return knex.schema.createTable('customer_follow_ups', table => {
        table.bigInteger('user_id').unsigned().notNullable()
        table.timestamp('timestamp').defaultTo(knex.fn.now())
        table.bigInteger('followed_by').unsigned().notNullable()
        table.text('remark')
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.dropTable('customer_follow_ups')
}
