exports.up = function (knex, Promise) {
    return knex.schema.createTable('classes', table => {
        table.bigIncrements('class_id')
        table.bigInteger('adviser_id')
        table.text('level')
        table.dateTime('start_time')
        table.dateTime('end_time')
        // opened 初始值, cancelled 已取消, 前端用时间自己判断的
        table.enum('status', ['opened', 'cancelled', 'ready', 'started', 'ended'])
        table.string('name')
        table.text('remark')
        table.string('topic')
        table.text('exercises')
        table.string('room_url')
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.dropTable('classes')
}
