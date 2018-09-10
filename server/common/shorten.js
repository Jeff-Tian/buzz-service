const _ = require('lodash')
const axios = require('axios')

module.exports = {
    async sina(url, key = 3271760578) {
        const res = await axios({
            method: 'get',
            url: `http://api.t.sina.com.cn/short_url/shorten.json?source=${key}&url_long=${encodeURI(url)}`,
        })
        return _.get(res, 'data.0.url_short')
    },
    async ft12(url) {
        const res = await axios({
            method: 'get',
            url: `http://api.ft12.com/api.php?url=${encodeURI(url)}`,
        })
        return _.get(res, 'data')
    },
}
