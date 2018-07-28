
exports.up = function (knex, Promise) {
    if (process.env.NODE_ENV === 'test') {
        return knex.schema.table('user_profiles', table => {
            table.dropColumn('weekly_schedule_requirements')
        }).then(() => knex.schema.table('user_profiles', table => {
            table.tinyint('weekly_schedule_requirements').defaultTo(1)
        }))
    }
    return knex.schema.alterTable('user_profiles', table => {
        table.tinyint('weekly_schedule_requirements').defaultTo(1).alter()
    })
}

exports.down = function (knex, Promise) {
    if (process.env.NODE_ENV === 'test') {
        return knex.schema.table('user_profiles', table => {
            table.dropColumn('weekly_schedule_requirements')
        }).then(() => knex.schema.table('user_profiles', table => {
            table.tinyint('weekly_schedule_requirements')
        }))
    }
    return knex.schema.alterTable('user_profiles', table => {
        table.tinyint('weekly_schedule_requirements').defaultTo(null).alter()
    })
}
