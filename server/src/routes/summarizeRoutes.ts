import { Router } from 'express'
import SummarizeController from 'src/controllers/summarizeController'

const router = Router()
const controller = new SummarizeController()
router.get('/', controller.summarize)

export default router
