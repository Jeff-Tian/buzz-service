const log4js = require('log4js')

const fundebug = require('fundebug-nodejs')
fundebug.apikey = '94756ccf446bb3095ab55793f767a5ba2c74b21d9e6f8b947eb4b1447e59e002'

log4js.configure({
    appenders: {
        file: { type: 'file', filename: 'buzz-corner-service.log', maxLogSize: 10485760, backups: 3 },
        console: { type: 'stdout' },
    },
    categories: {
        default: {
            appenders: ['file', 'console'],
            level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
        },
    },
})
const logger = log4js.getLogger()

/* eslint-disable */
Function.prototype.before = function (func) {
    const self = this
    return function () {
        if (func.apply(this, arguments) === false) {
            return false;
        }

        return self.apply(this, arguments)
    }
}
/* eslint-enable */

logger.error = logger.error.before(function (err) {
    fundebug.notifyError.call(this, err)
})

export default logger
