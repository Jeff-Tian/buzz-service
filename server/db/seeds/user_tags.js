exports.seed = function (knex, Promise) {
    // Deletes ALL existing entries
    return knex('user_tags').del()
        .then(() =>
            // Inserts seed entries
            knex('user_tags').insert([
                { user_id: 1, tag: 'rowValue1' },
                { user_id: 2, tag: 'rowValue2' },
                { user_id: 3, tag: 'rowValue3' },
            ]))
}
