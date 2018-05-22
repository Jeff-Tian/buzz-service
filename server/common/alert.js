const logger = require('./logger')
const axios = require('axios')

module.exports = async text => await axios({
    url: 'https://hook.bearychat.com/=bwCTD/incoming/3e95684ae5c2a33085fd4696e91c25cc',
    method: 'post',
    data: {
        channel: 'Service',
        markdown: true,
        text,
    },
}).catch(e => logger.error(e))
