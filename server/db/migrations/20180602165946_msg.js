exports.up = function (knex, Promise) {
    return knex.schema.createTable('msg', table => {
        table.bigIncrements('msg_id')
        table.bigInteger('class_id')
        table.bigInteger('from_user_id')
        table.bigInteger('to_user_id')
        table.string('type')
        table.boolean('read').defaultTo(false)
        table.boolean('deleted').defaultTo(false)
        table.timestamps(true, true)
        table.foreign('class_id').references('classes.class_id').onDelete('CASCADE').onUpdate('CASCADE')
        table.foreign('from_user_id').references('users.user_id').onDelete('CASCADE').onUpdate('CASCADE')
        table.foreign('to_user_id').references('users.user_id').onDelete('CASCADE').onUpdate('CASCADE')
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.dropTable('msg')
}
