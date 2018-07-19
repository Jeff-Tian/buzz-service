exports.up = function (knex, Promise) {
    if (process.env.NODE_ENV === 'test') {
        return knex.schema.dropTable('user_balance').then(() => knex.schema.createTable('user_balance', table => {
            table.bigInteger('user_id').unsigned().notNullable()
            table.decimal('class_hours')
            table.integer('integral')
            table.foreign('user_id').references('users.user_id').onDelete('CASCADE').onUpdate('CASCADE')
            table.primary(['user_id'])
        }))
    }

    return knex.schema.alterTable('user_balance', table => {
        table.decimal('class_hours').alter()
    })
}

exports.down = function (knex, Promise) {
    if (process.env.NODE_ENV === 'test') {
        return knex.schema.dropTable('user_balance').then(() => knex.schema.createTable('user_balance', table => {
            table.bigInteger('user_id').unsigned().notNullable()
            table.integer('class_hours')
            table.integer('integral')
            table.foreign('user_id').references('users.user_id').onDelete('CASCADE').onUpdate('CASCADE')
            table.primary(['user_id'])
        }))
    }

    return knex.schema.alterTable('user_balance', table => {
        table.integer('class_hours').alter()
    })
}
