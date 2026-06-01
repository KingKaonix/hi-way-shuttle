import { Router } from 'express';
import { tripController } from '../controllers/tripController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', tripController.listByDate);
router.get('/route/:routeId', tripController.listByRoute);
router.post('/generate', authenticate, requireRole('admin'), tripController.generate);

export default router;
