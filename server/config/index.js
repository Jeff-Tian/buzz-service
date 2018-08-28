const config = {
    test: {
        endPoints: {
            bullService: 'http://localhost:16222',
            redis: 'redis://:UP18QdLqqApiPtX8Y3cnbOBT9DrAQMVk@redis-16745.c12.us-east-1-4.ec2.cloud.redislabs.com:16745',
            buzzCorner: process.env.corner_base || 'http://corner-test.buzzbuzzenglish.com',
        },
        rootDomain: '.buzzbuzzenglish.com',
    },

    qa: {
        endPoints: {
            bullService: 'http://localhost:16222',
            // redis: `redis://:${process.env.redis_password}@localhost:6379`,
            redis: 'redis://localhost:6379',
            buzzCorner: process.env.corner_base || 'http://corner-test.buzzbuzzenglish.com',
        },
        rootDomain: '.buzzbuzzenglish.com',
    },

    production: {
        endPoints: {
            bullService: 'http://localhost:16222',
            redis: `redis://:${process.env.redis_password}@${process.env.redis_ip}:6379`,
            buzzCorner: process.env.corner_base || 'http://live.buzzbuzzenglish.com',
        },
        rootDomain: '.buzzbuzzenglish.com',
    },
}

module.exports = config[process.env.NODE_ENV || 'development']
