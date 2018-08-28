// Update with your config settings.
const path = require('path')
const BASE_PATH = path.join(__dirname, 'server', 'db')

module.exports = {

    development: {
        client: 'mysql',
        connection: {
            host: 'localhost',
            database: 'buzz',
            user: 'root',
            password: '1050709',
            timezone: 'UTC',
            charset: 'utf8mb4',
        },
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            directory: path.join(BASE_PATH, 'migrations'),
        },
        seeds: {
            directory: path.join(BASE_PATH, 'seeds'),
        },
    },

    test: {
        client: 'sqlite3',
        connection: {
            filename: './test.sqlite3',
            timezone: 'UTC',
        },
        migrations: {
            directory: path.join(BASE_PATH, 'migrations'),
        },
        seeds: {
            directory: path.join(BASE_PATH, 'seeds'),
        },
        useNullAsDefault: true,
    },

    qa: {
        client: 'mysql',
        connection: {
            host: process.env.RDS_BUZZ_HOST,
            user: process.env.RDS_BUZZ_USER,
            password: process.env.RDS_BUZZ_PASSWORD,
            database: 'buzz4', // process.env.RDS_BUZZ_DB,
            timezone: 'UTC',
            charset: 'utf8mb4',
        },
        migrations: {
            directory: path.join(BASE_PATH, 'migrations'),
        },
        seeds: {},
    },

    production: {
        client: 'mysql',
        connection: {
            host: process.env.RDS_BUZZ_HOST,
            user: process.env.RDS_BUZZ_USER,
            password: process.env.RDS_BUZZ_PASSWORD,
            database: process.env.RDS_BUZZ_DB,
            timezone: 'UTC',
            charset: 'utf8mb4',
        },
        migrations: {
            directory: path.join(BASE_PATH, 'migrations'),
        },
        seeds: {},
    },

}
