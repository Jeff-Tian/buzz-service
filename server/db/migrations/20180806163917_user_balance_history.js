exports.up = function (knex, Promise) {
    return knex.schema.table('user_balance_history', table => {
        table.bigInteger('by').unsigned()

        if (process.env.NODE_ENV !== 'test') {
            table.foreign('by').references('users.user_id').onDelete('CASCADE').onUpdate('CASCADE')
        }
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.table('user_balance_history', table => {
        if (process.env.NODE_ENV !== 'test') {
            table.dropForeign('by')
        }

        table.dropColumn('by')
    })
}
