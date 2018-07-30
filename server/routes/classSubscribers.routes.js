import ClassSubscriberController from '../controllers/classSubscriberController'

const Router = require('koa-router')
const router = new Router()
const BASE_URL = '/api/v1/class/subscribers'
router.get(`${BASE_URL}/:class_id`, ClassSubscriberController.getSubscribers)
module.exports = router
