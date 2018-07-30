exports.seed = function (knex, Promise) {
    // Deletes ALL existing entries
    return knex('users').del()
        .then(() =>
            // Inserts seed entries
            knex('users').insert([
                {
                    user_id: 1,
                    name: 'user1',
                    role: 'a',
                    created_at: new Date(2018, 1, 24, 9, 0),
                },
                {
                    user_id: 2,
                    name: 'rowValue2',
                    role: 's',
                    created_at: new Date(2018, 1, 25, 9, 0),
                },
                {
                    user_id: 3,
                    name: 'rowValue3',
                    role: 'c',
                    created_at: new Date(2018, 1, 23, 9, 0),
                },
                {
                    user_id: 4,
                    name: 'rowValue4',
                    role: 'c',
                    created_at: new Date(2018, 1, 23, 9, 0),
                },
                {
                    user_id: 5,
                    name: 'rowValue5',
                    role: 's',
                    created_at: new Date(2018, 1, 23, 9, 0),
                },
            ]))
}
