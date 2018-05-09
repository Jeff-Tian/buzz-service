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

export default logger
