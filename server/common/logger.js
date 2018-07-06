const log4js = require('log4js')
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
const oldErrorLogger = logger.error
logger.error = function (err) {
    const fundebug = require('fundebug-nodejs')
    fundebug.apikey = '94756ccf446bb3095ab55793f767a5ba2c74b21d9e6f8b947eb4b1447e59e002'
    fundebug.notifyError(err)

    oldErrorLogger.apply(this, err)
}

export default logger
