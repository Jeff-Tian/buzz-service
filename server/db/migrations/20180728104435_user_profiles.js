
exports.up = function (knex, Promise) {
    return knex.schema.alterTable('user_profiles', table => {
        table.tinyint('weekly_schedule_requirements').defaultTo(1).alter()
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.alterTable('user_profiles', table => {
        table.tinyint('weekly_schedule_requirements').defaultTo(null).alter()
    })
}
