exports.up = function (knex, Promise) {
    return knex.schema.createTable('class_subscribers', table => {
        table.bigInteger('class_id').unsigned()
        table.bigInteger('user_id').unsigned()

        table.foreign('user_id').references('users.user_id').onDelete('CASCADE').onUpdate('CASCADE')
        table.foreign('class_id').references('classes.class_id').onDelete('CASCADE').onUpdate('CASCADE')
        table.primary(['class_id', 'user_id'])
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.dropTable('class_subscribers')
}
