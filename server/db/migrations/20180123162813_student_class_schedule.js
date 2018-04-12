exports.up = function (knex, Promise) {
    return knex.schema.createTable('student_class_schedule', table => {
        table.bigInteger('user_id').unsigned().notNullable()
        table.biginteger('class_id').unsigned().nullable()
        table.dateTime('start_time')
        table.dateTime('end_time')
        // 'booking' 预约需求, 'cancelled' 取消, 'confirmed' 进班级的时候, 自动创建带班级id的一条,
        table.enum('status', ['booking', 'cancelled', 'confirmed', 'ready', 'started', 'ended', 'terminated'])

        table.foreign('user_id').references('users.user_id').onDelete('CASCADE').onUpdate('CASCADE')
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.dropTable('student_class_schedule')
}
