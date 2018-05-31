exports.up = function (knex, Promise) {
    return knex.schema.table('user_tags', table => {
        if (process.env.NODE_ENV !== 'test') {
            table.bigInteger('user_id').unsigned().alter()

            table.foreign('user_id').references('users.user_id').onDelete('CASCADE').onUpdate('CASCADE')
        }
    })
}

exports.down = function (knex, Promise) {
    if (process.env.NODE_ENV !== 'test') {
        return knex.schema.table('user_tags', table => {
            table.dropForeign('user_id')
        })
    }
}
