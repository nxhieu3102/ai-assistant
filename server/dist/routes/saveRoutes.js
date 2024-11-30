import { Router } from 'express';
import SaveController from 'src/controllers/saveController';
const router = Router();
const controller = new SaveController();
router.post('/', controller.save);
export default router;
