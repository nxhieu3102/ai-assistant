import { Router } from 'express'
import TranslateController from 'src/controllers/translateController'

const router = Router()
const translateController = new TranslateController()
router.get('/translate', translateController.translate)

export default router
