const Router = require('koa-router')
const router = new Router()
const faqController = require('../controllers/faqController')
const BASE_URL = '/api/v1/faq'
router.get(`${BASE_URL}/student_index`, faqController.student_index)
router.get(`${BASE_URL}/companion_index`, faqController.companion_index)
router.get(`${BASE_URL}/:id`, faqController.getById)
router.get(`${BASE_URL}`, faqController.query)
router.post(`${BASE_URL}`, faqController.upsert)

module.exports = router
