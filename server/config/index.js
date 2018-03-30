const config = {
    development: {
        endPoints: {
            bullService: 'http://localhost:16222',
        },
    },

    test: {
        endPoints: {
            bullService: 'http://localhost:16222',
        },
    },

    staging: {
        endPoints: {
            bullService: 'http://localhost:16222',
        },
    },

    qa: {
        endPoints: {
            bullService: 'http://localhost:16222',
        },
    },

    production: {
        endPoints: {
            bullService: 'http://localhost:16222',
        },
    },
}

module.exports = config[process.env.NODE_ENV || 'development']
