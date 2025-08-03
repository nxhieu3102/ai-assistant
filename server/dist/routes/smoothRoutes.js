import { Router } from 'express';
import SmoothController from 'src/controllers/smoothController';
const router = Router();
const controller = new SmoothController();
router.get('/', controller.smooth);
export default router;
