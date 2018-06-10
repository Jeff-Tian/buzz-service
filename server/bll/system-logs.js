const systemLogDal = require('../dal/system-logs')

module.exports = {
    async getLogs(who) {
        return systemLogDal.getLogs(who)
    },

    async log(who, didWhat) {
        return systemLogDal.log(who, didWhat)
    },
}
