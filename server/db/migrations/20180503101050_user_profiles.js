exports.up = function (knex, Promise) {
    return knex.schema.table('user_profiles', table => {
        table.tinyint('weekly_schedule_requirements')
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.table('user_profiles', table => {
        table.dropColumn('weekly_schedule_requirements')
    })
}
