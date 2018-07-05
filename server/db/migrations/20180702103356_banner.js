exports.up = function (knex, Promise) {
    return knex.schema.createTable('banner', table => {
        table.bigIncrements('banner_id')
        table.string('name')
        table.string('img_url')
        table.string('user_role')
        table.string('title')
        table.string('url')
        table.timestamp('start_at')
        table.timestamp('end_at')
        table.boolean('public').defaultTo(false)
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.dropTable('banner')
}
