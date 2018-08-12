exports.up = function (knex, Promise) {
    return knex.schema.createTable('user_class_log', table => {
        table.bigIncrements('user_class_log_id')
        table.bigInteger('class_id').unsigned()
        table.bigInteger('user_id').unsigned()
        table.string('type') // attend 前端点击上课;
        table.timestamps(true, true)
        table.foreign('class_id').references('classes.class_id').onDelete('CASCADE').onUpdate('CASCADE')
        table.foreign('user_id').references('users.user_id').onDelete('CASCADE').onUpdate('CASCADE')
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.dropTable('user_class_log')
}
