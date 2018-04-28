const Router = require('koa-router')
const router = new Router()
const bookingController = require('../controllers/bookingController')
const BASE_URL = '/api/v1/bookings'
router.post(`${BASE_URL}/batch/:user_id`, bookingController.batchCreateBookings)
router.get(`${BASE_URL}/batch/:user_id`, bookingController.listBatchBookingsForSingleUser)
router.del(`${BASE_URL}/batch/:user_id/:batch_id`, bookingController.cancelBatchBookingForSingleUser)
router.get(`${BASE_URL}/batch`, bookingController.listBatchBookingsForMultipleUsers)
router.get(`${BASE_URL}/all`, bookingController.listAllBookingsForMultipleUsers)

module.exports = router
