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
            bullService: '',
        },
    },

    qa: {
        endPoints: {
            bullService: '',
        },
    },

    production: {
        endPoints: {
            bullService: '',
        },
    },
}

module.exports = config[process.env.NODE_ENV || 'development']
