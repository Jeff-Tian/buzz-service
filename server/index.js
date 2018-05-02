const Koa = require('koa')
const usersRoutes = require('./routes/users.routes')
const studentClassSchedule = require('./routes/studentClassSchedule.routes')
const companionClassSchedule = require('./routes/companionClassSchedule.routes')
const classSchedule = require('./routes/classSchedule.routes')
const monitorsRoutes = require('./routes/monitors.routes')
const feedbackRoutes = require('./routes/feedback.routes')
const userBalanceRoutes = require('./routes/user-balance.routes')
const userPlacementTestsRoutes = require('./routes/user-placement-tests.routes')
const wechatRoutes = require('./routes/wechat.routes')
const qiniuRoutes = require('./routes/qiniu.routes')
const mobileRoutes = require('./routes/mobile.routes')
const mailRoutes = require('./routes/mail.routes')
const bookingRoutes = require('./routes/booking.routes')
const redis = require('./common/redis')
const bodyParser = require('koa-bodyparser')

const app = new Koa()
const PORT = process.env.PORT || 16888
app.use(bodyParser())
app.use(usersRoutes.routes())
app.use(studentClassSchedule.routes())
app.use(companionClassSchedule.routes())
app.use(feedbackRoutes.routes())
app.use(classSchedule.routes())
app.use(monitorsRoutes.routes())
app.use(userBalanceRoutes.routes())
app.use(userPlacementTestsRoutes.routes())
app.use(wechatRoutes.routes())
app.use(qiniuRoutes.routes())
app.use(mobileRoutes.routes())
app.use(mailRoutes.routes())
app.use(bookingRoutes.routes())

const server = app.listen(PORT, () => {
    console.log('Buzz-Service 启动完毕。')
})

server.on('error', err => {
    console.error('========================')
    console.error(err)
    console.error('========================')
})

server.on('close', () => {
    redis.redis.disconnect()
    console.log('Buzz-Service 关闭了。')
})

module.exports = server
